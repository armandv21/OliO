from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
import time
import httpx
from typing import List, Optional

app = FastAPI(title="OliO Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://armandv21.github.io",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

KNOWLEDGE_BASE_URL = "https://raw.githubusercontent.com/armandv21/OliO/main/knowledge_base.md"
_kb_cache: dict = {"content": None, "ts": 0}
KB_TTL = 3600  # 1 hour


async def get_knowledge_base() -> str:
    now = time.time()
    if _kb_cache["content"] and now - _kb_cache["ts"] < KB_TTL:
        return _kb_cache["content"]
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(KNOWLEDGE_BASE_URL, timeout=10.0)
            resp.raise_for_status()
            _kb_cache["content"] = resp.text
            _kb_cache["ts"] = now
            return _kb_cache["content"]
    except Exception as e:
        if _kb_cache["content"]:
            return _kb_cache["content"]
        raise HTTPException(status_code=503, detail=f"Knowledge base unavailable: {e}")


class Message(BaseModel):
    role: str
    content: str


class CopilotRequest(BaseModel):
    message: str
    conversation: List[Message] = []
    user_profile: Optional[dict] = None


class CopilotResponse(BaseModel):
    reply: str


@app.post("/copilot", response_model=CopilotResponse)
async def copilot(req: CopilotRequest):
    kb = await get_knowledge_base()

    profile_ctx = ""
    if req.user_profile:
        profile_ctx = (
            "\n\nPROFIL UTILISATEUR ACTUEL:\n"
            f"- Pseudo: {req.user_profile.get('pseudo', '—')}\n"
            f"- Abonnement: {req.user_profile.get('abonnement', 'gratuit')}\n"
        )

    system_prompt = (
        "Tu es le copilote financier d'OliO, une application d'optimisation de portefeuille.\n"
        "Tu reponds TOUJOURS en francais, de facon precise et concise (max 3-4 paragraphes).\n"
        "Tu t'appuies sur la base de connaissances ci-dessous. Tu ne donnes pas de conseils "
        "en investissement personnalises — tu informes et expliques uniquement.\n\n"
        f"BASE DE CONNAISSANCES:\n{kb}"
        f"{profile_ctx}"
    )

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    messages = [{"role": "system", "content": system_prompt}]
    for m in req.conversation[-8:]:
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": req.message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=800,
        temperature=0.4,
    )

    return CopilotResponse(reply=response.choices[0].message.content)


# ── Stripe endpoints ────────────────────────────────────────────────────────
import stripe
from supabase import create_client
from fastapi import Request

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
supabase = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", ""),
)


@app.post("/create-checkout-session")
async def create_checkout_session(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": os.getenv("STRIPE_PRICE_ID"), "quantity": 1}],
        success_url=os.getenv("FRONTEND_URL", "") + "?upgraded=true",
        cancel_url=os.getenv("FRONTEND_URL", ""),
        metadata={"user_id": user_id},
    )
    return {"url": session.url}


@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig, os.getenv("STRIPE_WEBHOOK_SECRET", "")
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            supabase.table("data").update({"abonnement": "pro"}).eq("id", user_id).execute()

    return {"status": "ok"}
