# TalentIQ AI — ATS Scoring Policy & Mathematical Model

## 1. Overview and Purpose

TalentIQ AI provides an objective, transparent, and auditable Applicant Tracking System (ATS) evaluation model.

Unlike opaque black-box systems that claim arbitrary percentages as an "industry standard", TalentIQ AI defines its scoring policy deterministically across four explicitly weighted evaluation pillars totaling 100%.

---

## 2. Mathematical Scoring Formula

The overall ATS score is computed as:

$$\text{OverallScore} = 0.20 \times \text{FormatScore} + 0.35 \times \text{KeywordScore} + 0.25 \times \text{CompletenessScore} + 0.20 \times \text{RelevanceScore}$$

Where all component scores range from $0.0$ to $100.0$, rounded to one decimal place.

---

## 3. Pillar Breakdown & Criteria

### Pillar 1: Structure & Format Quality (Weight: 20%)
Evaluates document parsing readiness and machine readability.

1. **Contact Credentials (Max 30 pts):**
   - Full Name detected: $+10$ pts
   - Valid professional email address: $+10$ pts
   - Verified phone number: $+10$ pts
2. **Standard Section Headings (Max 40 pts):**
   - Conventional heading recognized for *Experience*: $+10$ pts
   - Conventional heading recognized for *Education*: $+10$ pts
   - Conventional heading recognized for *Skills*: $+10$ pts
   - Conventional heading recognized for *Projects* or *Summary*: $+10$ pts
3. **Document Length & Readability (Max 30 pts):**
   - Optimal density between 250 and 1,500 extractable words: $+30$ pts
   - Under 250 words (brief): $+15$ pts + recommendation to elaborate
   - Over 1,500 words (dense): $+20$ pts + recommendation to condense

$$\text{FormatScore} = \min(100.0, \text{Points})$$

---

### Pillar 2: Keyword & Skill Alignment (Weight: 35%)
Evaluates alignment with the target requisition.

- **With Target Job Selected:**
  - Let $R$ be the set of mandatory required skills for the job.
  - Let $P$ be the set of preferred skills for the job.
  - Let $M_R$ be the matched required skills present in the resume.
  - Let $M_P$ be the matched preferred skills present in the resume.

$$\text{KeywordScore} = \begin{cases} 
\left(0.75 \times \frac{|M_R|}{|R|} + 0.25 \times \frac{|M_P|}{|P|}\right) \times 100 & \text{if } |P| > 0 \\
\left(\frac{|M_R|}{|R|}\right) \times 100 & \text{if } |P| = 0 
\end{cases}$$

- **General ATS Evaluation (No target job selected):**
  - Evaluated against technical skill density across recognized software, data, and cloud engineering domains:
    - $\ge 8$ verified technical skills: $95.0$
    - $5 - 7$ verified technical skills: $80.0$
    - $3 - 4$ verified technical skills: $65.0$
    - $< 3$ verified technical skills: $40.0$

---

### Pillar 3: Completeness & Measurable Evidence (Weight: 25%)
Evaluates whether statements are backed by tangible evidence and quantified outcomes.

1. **Employment History:**
   - $\ge 2$ structured work experiences: $+35$ pts
   - $1$ work experience: $+25$ pts
2. **Technical Projects:**
   - $\ge 2$ featured projects: $+25$ pts
   - $1$ featured project: $+15$ pts
3. **Academic Credentials:**
   - Institution, degree, or graduation date detected: $+20$ pts
4. **Quantified Impact Metrics:**
   - Detects measurable outcomes (e.g., percentages, scale indicators, query latency, user counts, transaction volumes):
     - $\ge 3$ metric indicators: $+20$ pts
     - $1 - 2$ metric indicators: $+10$ pts
     - $0$ metric indicators: $+0$ pts + recommendation to quantify impact

$$\text{CompletenessScore} = \min(100.0, \text{Points})$$

---

### Pillar 4: Role Relevance & Seniority Context (Weight: 20%)
Evaluates alignment between resume experience and target position.

- **Title Matching:**
  - Exact target role title in summary or experience: $+20$ pts
  - Partial title term match: $+10$ pts
- **Recency:**
  - Currently active in technology/engineering role: $+15$ pts
  - Previous tenure: $+5$ pts
- **Base Domain Relevance:** $+60$ pts baseline.

$$\text{RelevanceScore} = \min(100.0, \text{Points})$$

---

## 4. Known Limitations & Audit Disclaimer

1. **OCR Scope:** Optical Character Recognition is explicitly not supported for raster or scanned image documents without an underlying text layer. Documents with low extractable text generate a `LOW_TEXT_WARNING` instructing the candidate to upload text-layer documents.
2. **Heuristic Nature:** The ATS score is an automated algorithmic heuristic designed to improve searchability and parsing fidelity. It does not replace qualitative human recruiter review or practical code testing.
3. **No Industry Standardization:** There is no universal "ISO standard" for ATS scoring across corporate systems; TalentIQ AI's model prioritizes transparency, auditability, and clear guidance for candidates.
