# BASE DE CONNAISSANCES — OLIO COPILOTE v1.0

> Source de vérité du copilote OliO. Couvre la navigation dans l'app, les principes financiers, l'analyse d'entreprises, les profils de risque, la fiscalité française et les mécanismes de marché.

---

## [SYSTÈME] Instructions du Copilote

Tu es le copilote financier intégré à OliO. Tu réponds TOUJOURS en français, de façon précise et pédagogique. Tu ne fournis pas de conseils en investissement personnalisés — tu informes et expliques uniquement. Pour les questions sur l'app OliO, réfère-toi à [OLIO APP]. Pour les questions financières, utilise [FINANCE], [ANALYSE], [MARCHÉS]. Pour les profils de risque, utilise [PROFILS]. Pour la fiscalité française, utilise [FISCALITÉ].

---

## [OLIO APP] Guide Complet de l'Application

### Architecture de l'Interface
OliO est une application web d'optimisation de portefeuille basée sur la théorie de Markowitz et la simulation Monte Carlo. Interface : sidebar gauche (sélection actifs + paramètres) + zone principale (graphiques, résultats) + barre de navigation en haut.

### Sidebar — Sélection des Actifs
- Barre de recherche : filtrer les actifs disponibles (actions, ETF, indices)
- Cases à cocher : sélectionner les actifs à analyser (minimum 2 requis)
- Bouton "Réinitialiser" : désélectionner tous les actifs
- Section "Paramètres" (collapsible) :
  - Période historique : 1 à 10 ans (défaut 2 ans)
  - Taux sans risque : 0% à 10% (défaut 3%)
- Bouton "Calculer" : lance l'optimisation Monte Carlo
- Bouton ▶ : développe la sidebar pour voir tous les actifs avec rendement et volatilité

### Barre de Navigation (Topbar)
- Onglet **Analyse** : frontière efficiente de Markowitz
- Onglet **CML interactive** : Capital Market Line avec point déplaçable
- Onglet **Niveaux de risque** : visualisation par niveaux de risque
- Bouton **Articles** : bibliothèque pédagogique de 23+ articles financiers
- Bouton **Mes portefeuilles** : sauvegarder et recharger ses portefeuilles
- Bouton **Connexion** / Avatar profil (en haut à droite)

### Onglet Analyse (Frontière Efficiente)
- KPI bar : Rendement tangent, Volatilité tangent, Sharpe max, Nb actifs analysés
- Graphique frontière efficiente : nuage Monte Carlo, courbe efficiente, point tangent
- Tableau performances individuelles : rendement, volatilité, Sharpe par actif
- Matrice de corrélation : heatmap colorée de toutes les paires d'actifs

### Onglet CML Interactive
- Graphique CML : droite du taux sans risque au portefeuille tangent et au-delà (levier)
- Point déplaçable : glisser pour ajuster l'exposition Cash/Tangent/Levier
- Barre de mix : proportion visuelle Cash vs Tangent vs Levier
- KPIs dynamiques : Rendement, Volatilité, Sharpe du mix sélectionné (éditables)
- Composition du portefeuille : tableau des poids + camembert interactif
- Diagnostic CML + Enregistrer le portefeuille (connexion requise)

### Onglet Niveaux de Risque
- Visualisation du portefeuille tangent selon différents niveaux de risque cibles
- Diagnostic du portefeuille, Composition ETF équivalent
- Enregistrer le portefeuille (connexion requise)

### Articles (panneau plein écran)
Bibliothèque pédagogique : MEDAF, Bêta, APT, P/E, Price/Book, Price/Sales, Price/FCF, PEG, EV/Revenue, Capitalisation, BNA, FCF, Marge opérationnelle, Marge nette, ROE, Dividende, Payout Ratio, Actions en circulation, Dette/CP, Dette/EBITDA, Couverture intérêts, DCF, Reverse DCF.

### Fiche Actif Complète
Onglets : Aperçu (P/E, Dividende, Cap, Bêta, BNA), Prix, Valorisation (P/B, P/S, P/FCF, PEG, EV/Rev, Payout), Dividendes, Finances, Croissance, Rentabilité (marges, ROE), Santé (dette, couverture), DCF (3 méthodes + Reverse DCF), Segments.

### Abonnements
- Gratuit : limite 3 actifs simultanément
- Pro : accès complet sans limite (upgrade via profil → "Passer à la version Pro")
- Premium : accès illimité avec fonctionnalités exclusives

---

## [FINANCE] Principes Financiers Fondamentaux

### Classes d'Actifs

**Actions** : titre de propriété d'une fraction d'entreprise. Rendement = dividendes + plus-values. Marchés : Euronext Paris (CAC40), NYSE/NASDAQ (USA), LSE (UK), Tokyo, Shanghai.

**Obligations** : titre de créance. Coupon fixe ou variable. Prix obligation ↑ quand taux ↓ (relation inverse). Rating : investment grade (AAA à BBB-) vs high yield (BB+ et moins). Duration = sensibilité au risque de taux.

**ETF** : paniers d'actifs cotés. Réplication indicielle passive. TER très bas (0,03%-0,5%). Cadre UCITS en Europe. Liquidité intraday. Types : actions, obligations, matières premières, sectoriels, smart beta.

**Matières premières** : or (valeur refuge), pétrole (WTI/Brent), métaux, agricoles. Couverture contre inflation.

**Crypto-actifs** : Bitcoin (21M unités max), Ethereum (smart contracts). Volatilité extrême. Pas de cash flows fondamentaux.

**SCPI/REIT** : immobilier pierre-papier. Revenus locatifs 4-6%. REITs cotés = liquidité bourse.

**Dérivés** : options (call = droit d'achat, put = droit de vente), futures, swaps. Usage : couverture ou spéculation.

### Théorie Moderne du Portefeuille (Markowitz, 1952)

**Rendement portefeuille** : μp = Σ wi × μi
**Risque portefeuille** : σp² = ΣΣ wi × wj × Cov(i,j)
**Diversification** : si ρ < 1 entre actifs, σp < Σ wi × σi. Risque spécifique s'annule. Risque systématique = incompressible.
**Frontière efficiente** : rendement maximal pour chaque niveau de risque. Calculée dans OliO par simulation Monte Carlo.
**Portefeuille tangent** : maximise le ratio de Sharpe. Point de tangence avec la CML.

### Capital Market Line (CML)
Droite partant du taux sans risque Rf jusqu'au portefeuille tangent T et au-delà.
- Pente = ratio de Sharpe du portefeuille tangent = (μT - Rf) / σT
- α > 0 : mix Cash + Tangent (défensif)
- α = 0 : 100% portefeuille tangent
- α < 0 : levier (emprunt pour acheter plus de T)

### Métriques de Risque

**Volatilité annualisée** = σ_quotidien × √252
**Ratio de Sharpe** = (μ - Rf) / σ. >1 = bon, >2 = excellent, <0 = mauvais
**Ratio de Sortino** = (μ - Rf) / σ_downside. Pénalise uniquement la volatilité négative
**Beta (β)** = Cov(Ri, Rm) / Var(Rm). β=1 suit le marché. β>1 amplifie. β<1 amortit. β<0 contre-cyclique
**Alpha (α) de Jensen** = μi - [Rf + βi(μm - Rf)]. Surperformance ajustée du risque
**VaR** : perte maximale à 95%/99% de confiance sur 1j ou 10j
**Max Drawdown** = (Pic - Creux) / Pic. Amplitude de la pire baisse
**Corrélation ρ** ∈ [-1, +1]. La matrice OliO est symétrique, diagonale = 1

### Modèles d'Évaluation

**MEDAF/CAPM** : E(Ri) = Rf + βi × (E(Rm) - Rf). Prime de risque marché historique ≈ 4-7%.
**APT (Ross 1976)** : Ri = αi + Σ βij × Fj + εi. Facteurs : PIB, inflation, taux, spread crédit, pétrole.
**Fama-French** : 3 facteurs (marché + SMB size + HML value). 5 facteurs (+ RMW rentabilité + CMA investissement).
**Momentum** : Carhart 4ème facteur. Gagnants récents (3-12 mois) surperforment.

---

## [ANALYSE] Analyse Fondamentale d'Entreprises

### Multiples de Valorisation

**P/E** = Prix / BNA. Nb d'années de bénéfices pour récupérer le prix. Moyenne S&P500 ≈ 15-18x. CAPE = P/E sur 10 ans.
**PEG** = P/E / Taux de croissance BNA. Peter Lynch : PEG < 1 = potentiellement attractif.
**Price/Book** = Capitalisation / Valeur comptable. P/B < 1 = négocie sous actif net.
**Price/Sales** = Capitalisation / CA. Utile pour entreprises non profitables.
**Price/FCF** = Capitalisation / FCF. Plus conservateur que P/E.
**EV/EBITDA** = Valeur d'entreprise / EBITDA. Standard M&A/LBO. Tech 15-25x, industrie 6-12x.
**EV/Revenue** = Valeur d'entreprise / CA. Pour startups sans profits.
**Capitalisation** = Prix × Nb actions. Large cap >10Md€, Mid 2-10Md€, Small <2Md€.
**EV** = Market Cap + Dette nette. Coût théorique d'acquisition totale.

### DCF et Valorisation Intrinsèque

**DCF** : actualiser FCF futurs au WACC. WACC = coût moyen pondéré du capital.
- WACC = (E/(E+D)) × Re + (D/(E+D)) × Rd × (1-T)
- Re = Rf + β × prime de risque
- Valeur terminale = FCFn+1 / (WACC - g)
- Très sensible aux hypothèses (±1% WACC = ±20-30% valeur)

OliO calcule 3 méthodes DCF : croissance CA, croissance BNA, croissance FCF.

**Reverse DCF** : partir du cours actuel pour retrouver le taux de croissance implicite.

### Compte de Résultat
CA → - COGS → Marge brute → - SG&A/R&D → **EBIT** (marge opérationnelle) → - Intérêts/Impôts → **Bénéfice net** (marge nette). EBITDA = EBIT + D&A.

**BNA/EPS** = Bénéfice net / Nb actions. Dilué inclut options, convertibles.

### Rentabilité

**Marge opérationnelle** = EBIT / CA. Efficacité du cœur de métier. SaaS 20-40%, retail 2-5%.
**Marge nette** = Bénéfice net / CA. Ce qui reste pour actionnaires.
**ROE** = Bénéfice net / Capitaux propres. Buffett cherche ROE >15% stable sur 10 ans.
**ROIC** = NOPAT / Capital investi. ROIC > WACC = création de valeur.

### Flux de Trésorerie

**FCF** = Cash opérationnel - Capex. Cash libre disponible après investissements.
**FCF Yield** = FCF / Capitalisation. Inverse du P/FCF. >5% = potentiellement attractif.

### Dividendes et Retour Actionnaires

**Rendement dividende** = Dividende / Prix. >6% = surveiller (peut signaler détresse).
**Payout Ratio** = Dividende / BNA. >100% = non soutenable.
**Buyback** : rachat d'actions. Réduit le nombre d'actions, augmente BNA mécaniquement.

### Santé Financière

**Dette/CP (D/E)** : >2x = fortement endetté (hors financières).
**Dette/EBITDA** : <2x faible, 2-3x modéré, >4x élevé, >6x très risqué.
**Couverture intérêts (ICR)** = EBIT / Charges intérêts. <2x = zone danger, >5x = confortable.

### Valorisation Sectorielle Indicative

| Secteur | P/E | EV/EBITDA |
|---|---|---|
| Tech SaaS | 30-50x | 20-40x |
| Industrie | 15-20x | 8-12x |
| Banques | 10-14x | N/A |
| Consommation base | 18-25x | 12-18x |
| Énergie | 12-18x | 4-8x |
| Santé | 20-30x | 14-20x |
| REIT | N/A | 15-20x |

---

## [PROFILS] Profils de Risque et Allocation

### Classification

**Prudent (Défensif)** : préservation du capital. Horizon <3 ans. Perte max ~10%.
Allocation : 70-80% obligations/monétaire, 10-20% actions.
Profil type : retraité, objectif court terme.

**Équilibré (Modéré)** : croissance régulière avec protection. Horizon 3-7 ans. Perte max ~20%.
Allocation : 40-60% actions, 30-50% obligations.
Profil type : épargnant 35-55 ans, revenus stables.

**Dynamique (Croissance)** : croissance long terme. Horizon 7-15 ans. Perte max ~35%.
Allocation : 70-80% actions, 10-20% obligations.
Profil type : investisseur 25-45 ans, horizon retraite.

**Offensif (Agressif)** : maximisation rendement. Horizon >15 ans. Perte max >50%.
Allocation : 85-100% actions, possible levier.
Profil type : jeune investisseur, expert marchés.

### Déterminants du Profil

**Horizon temporel** : critère principal. Long horizon = corrections récupérables. Règle : % obligations ≈ 120 - âge.
**Capacité financière** : revenus stables + épargne de précaution 3-6 mois → plus de risque acceptable.
**Tolérance psychologique** : "sleeping test" — pouvez-vous dormir avec -30% sur votre portefeuille ?
**Objectifs** : retraite (long, croissance), achat RP (court, défensif), épargne enfants (mixte).

### Indicateurs de Risque OliO

- Volatilité : <8% prudent, 8-15% équilibré, 15-25% dynamique, >25% offensif
- Max Drawdown : <10% prudent, 10-20% équilibré, 20-35% dynamique, >35% offensif
- Ratio de Sharpe : indépendant du profil. Bon portefeuille vise >1

---

## [FISCALITÉ] Enveloppes d'Investissement France

**PEA** : plafond 150k€. Exonération IR après 5 ans (PS 17,2% restants). Uniquement actions/OPCVM européens + ETF éligibles.

**CTO** : universel. Flat Tax 30% = 12,8% IR + 17,2% PS. Option barème progressif si TMI < 12,8%.

**Assurance-vie** : hors bilan successoral. Fonds euros (capital garanti) + UC (risquées). Avantages fiscaux après 8 ans (abattement 4 600€/an). Transmission : 152 500€/bénéficiaire sans droits.

**PER** : déductible à l'entrée (économie = TMI × versement). Bloqué jusqu'à retraite.

**Livret A** : 3% (2024), exonéré, plafond 22 950€, liquidité immédiate.

**Flat Tax (PFU)** : 30% = 12,8% IR + 17,2% PS sur tous les revenus du capital.

---

## [MARCHÉS] Mécanismes de Marché

### Séances et Structure

**Horaires** : NYSE/NASDAQ 15h30-22h (Paris). Euronext Paris 9h00-17h30.
**Spread** = Ask - Bid. Market makers tiennent le spread.
**Types d'ordres** : marché (priorité vitesse), limite (priorité prix), stop-loss.

### Indices de Référence

**France** : CAC 40, SBF 120.
**Europe** : Euro Stoxx 50, DAX (Allemagne), FTSE 100 (UK).
**USA** : S&P 500 (référence mondiale), NASDAQ 100 (top tech).
**Monde** : MSCI World (23 pays développés, USA ~65%), MSCI ACWI (+ émergents).

### Macro et Corrélations

**Taux d'intérêt ↑** → obligations ↓, actions croissance ↓, dollar ↑, émergents ↓.
**Inflation ↑** → obligations nominales ↓, matières premières ↑, immobilier ↑.
**Dollar ↑** → matières premières libellées $ ↓, émergents ↓.
**VIX** : indice de peur. >20 = stress, >40 = crise. Corrélation négative avec S&P 500.
**Yield curve inversée** (10a - 2a < 0) = signal de récession dans 6-18 mois.

**Cycle économique** :
- Expansion → cycliques (tech, luxe, auto)
- Peak → matières premières, énergie
- Récession → défensives (pharma, alimentation), obligations d'État
- Reprise → value, small caps

---

*Dernière mise à jour : juin 2025 — Fichier source de vérité pour le copilote OliO. Pour enrichir ce document, éditer directement sur GitHub.*
