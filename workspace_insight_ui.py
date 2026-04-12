"""
UI helpers for WHY-first insight breakdown (Streamlit + Plotly).
Keeps driver inference, chart building, and copy generation out of the page file.
"""

from __future__ import annotations

import html
import re
from typing import Any, Literal, Optional

import pandas as pd
import plotly.graph_objects as go

Polarity = Literal["outflow", "inflow", "neutral"]

# Example structure for docs / tests
EXAMPLE_DRIVERS: list[dict[str, Any]] = [
    {
        "label": "Housing",
        "value": 185_000.0,
        "pct": 0.34,
        "impact": "High",
        "polarity": "outflow",
    },
    {
        "label": "Debt Payment",
        "value": 142_000.0,
        "pct": 0.26,
        "impact": "High",
        "polarity": "outflow",
    },
    {
        "label": "Groceries",
        "value": 68_000.0,
        "pct": 0.12,
        "impact": "Medium",
        "polarity": "outflow",
    },
    {
        "label": "Salary credit",
        "value": 420_000.0,
        "pct": 0.55,
        "impact": "High",
        "polarity": "inflow",
    },
]


def _detect_polarity(metric_name: str, column_names: list[str]) -> Polarity:
    joined = " ".join(column_names).lower()
    m = metric_name.lower()
    out_tokens = ("debit", "expense", "cost", "spend", "payment", "outflow", "loss")
    in_tokens = ("credit", "revenue", "income", "salary", "inflow", "gain")
    if any(t in m or t in joined for t in out_tokens):
        return "outflow"
    if any(t in m or t in joined for t in in_tokens):
        return "inflow"
    return "neutral"


def _impact_for_pct(pct: float) -> str:
    if pct >= 0.25:
        return "High"
    if pct >= 0.10:
        return "Medium"
    return "Low"


def _format_currency(value: float) -> str:
    if abs(value) >= 1_000_000:
        return f"₹{value / 1_000_000:.2f}M"
    if abs(value) >= 100_000:
        return f"₹{value / 100_000:.2f}L"
    if abs(value) >= 1000:
        return f"₹{value:,.0f}"
    return f"₹{value:,.2f}"


def infer_drivers_from_dataframe(df: pd.DataFrame) -> tuple[list[dict[str, Any]], Optional[str], Optional[str]]:
    """
    Returns (drivers, dimension_name, metric_name) or ([], None, None) if not inferable.
    Each driver: label, value, pct, impact, polarity
    """
    if df is None or df.empty:
        return [], None, None

    num_cols = df.select_dtypes(include=["number"]).columns.tolist()
    if not num_cols:
        return [], None, None

    cat_cols = df.select_dtypes(exclude=["number", "datetime", "datetimetz"]).columns.tolist()
    for col in list(cat_cols):
        try:
            pd.to_datetime(df[col], errors="raise")
            cat_cols.remove(col)
        except Exception:
            pass

    metric = num_cols[0]
    polarity = _detect_polarity(metric, list(df.columns))

    if not cat_cols:
        s = df[metric].abs()
        total = float(s.sum()) or 1.0
        top = s.nlargest(min(5, len(s)))
        drivers = []
        for label, val in top.items():
            v = float(val)
            pct = v / total
            drivers.append(
                {
                    "label": f"Row {int(label) + 1}",
                    "value": v,
                    "pct": pct,
                    "impact": _impact_for_pct(pct),
                    "polarity": polarity,
                }
            )
        return drivers, "(index)", metric

    dimension = cat_cols[0]
    agg = df.groupby(dimension, dropna=False)[metric].apply(lambda s: float(s.abs().sum())).reset_index()
    agg.columns = [dimension, "_v"]
    agg = agg.sort_values("_v", ascending=False).head(5)
    total = float(agg["_v"].sum()) or 1.0
    drivers = []
    for _, row in agg.iterrows():
        v = float(row["_v"])
        pct = v / total
        drivers.append(
            {
                "label": str(row[dimension]) if pd.notna(row[dimension]) else "Unknown",
                "value": v,
                "pct": pct,
                "impact": _impact_for_pct(pct),
                "polarity": polarity,
            }
        )
    return drivers, dimension, metric


def build_key_insight_text(drivers: list[dict[str, Any]]) -> str:
    """One-line executive takeaway (plain text; escape before HTML)."""
    if len(drivers) >= 2:
        a, b = drivers[0]["label"], drivers[1]["label"]
        combined = (drivers[0]["pct"] + drivers[1]["pct"]) * 100
        pol = drivers[0].get("polarity", "neutral")
        if pol == "inflow":
            tail = "total inflows in this view."
        elif pol == "outflow":
            tail = "total spending in this view."
        else:
            tail = "this breakdown."
        return f"{a} and {b} together account for ~{combined:.0f}% of {tail}"
    if len(drivers) == 1:
        d = drivers[0]
        return f"{d['label']} drives ~{d['pct'] * 100:.0f}% of the total — the single largest lever."
    return "Run a question that returns categories and amounts to unlock a one-line key insight."


def key_insight_block_html(insight_plain: str) -> str:
    """Single-line HTML (no leading whitespace) so Streamlit markdown does not treat it as a code block."""
    esc = html.escape(insight_plain.strip())
    return (
        '<div class="key-insight-block">'
        '<span class="key-insight-label">Key insight</span>'
        f'<p class="key-insight-text">{esc}</p>'
        "</div>"
    )


def build_why_narrative(drivers: list[dict[str, Any]], max_sentences: int = 2) -> str:
    if not drivers:
        return "Run a breakdown query to see which categories or segments drive this result."
    top = drivers[:2]
    parts = []
    for d in top:
        parts.append(f"{d['label']} ({d['pct']*100:.0f}% of the total)")
    if len(drivers) >= 2:
        combined = drivers[0]["pct"] + drivers[1]["pct"]
        tail = (
            f"Together, {drivers[0]['label']} and {drivers[1]['label']} account for about "
            f"{combined*100:.0f}% of what you see here—clear primary drivers."
        )
    else:
        tail = f"{drivers[0]['label']} is the dominant contributor at {drivers[0]['pct']*100:.0f}%."
    s1 = f"The main contributors are {parts[0]}" + (f" and {parts[1]}." if len(parts) > 1 else ".")
    if max_sentences >= 2:
        return f"{s1} {tail}"
    return s1


def _bar_color_for_rank(rank_smallest0: int, n: int, pol: str) -> str:
    """rank 0 = smallest bar, n-1 = largest (top driver) — largest gets darkest pop color."""
    if n <= 1:
        if pol == "outflow":
            return "#9B1C1C"
        if pol == "inflow":
            return "#065F46"
        return "#1E3A5F"
    if pol == "outflow":
        ramp = ["#FCE8E8", "#F5C4C4", "#E88888", "#C53A3A", "#9B1C1C"]
    elif pol == "inflow":
        ramp = ["#E6F9F1", "#B8EDD4", "#5FD9A8", "#1FA87A", "#065F46"]
    else:
        ramp = ["#EBF0FA", "#C5D4F0", "#6B9AE8", "#3C6BC7", "#1E3A5F"]
    t = rank_smallest0 / (n - 1)
    idx = min(int(round(t * (len(ramp) - 1))), len(ramp) - 1)
    return ramp[idx]


def build_driver_bar_chart(
    drivers: list[dict[str, Any]],
    *,
    title: str = "Contribution by driver",
) -> Optional[go.Figure]:
    if not drivers:
        return None
    # Plotly h-bar: first y category at bottom — put smallest first so largest sits on top.
    rev = list(reversed(drivers))
    n = len(rev)
    labels = [d["label"] for d in rev]
    values = [float(d["value"]) for d in rev]
    colors = []
    for i, d in enumerate(rev):
        pol = d.get("polarity", "neutral") or "neutral"
        colors.append(_bar_color_for_rank(i, n, pol))

    fig = go.Figure(
        go.Bar(
            y=labels,
            x=values,
            orientation="h",
            marker=dict(color=colors, line=dict(width=0)),
            text=[_format_currency(v) for v in values],
            textposition="outside",
        )
    )
    fig.update_layout(
        title=dict(text=title, font=dict(size=14, color="#122033")),
        template="plotly_white",
        margin=dict(l=0, r=24, t=36, b=0),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        xaxis=dict(showgrid=True, gridcolor="#E8EEF8", zeroline=False),
        yaxis=dict(tickfont=dict(size=12, color="#4A5A70")),
        height=max(220, 48 * len(drivers)),
        showlegend=False,
    )
    return fig


def driver_row_html(d: dict[str, Any], *, rank: int = 0) -> str:
    """Compact one-line HTML per row — indented multiline HTML is parsed as Markdown code blocks."""
    pol = d.get("polarity", "neutral")
    if pol == "outflow":
        val_color = "#9B1C1C" if rank == 0 else "#C23B3B"
        border = "#E85D5D" if rank == 0 else "rgba(226, 88, 88, 0.35)"
    elif pol == "inflow":
        val_color = "#065F46" if rank == 0 else "#1F9D6A"
        border = "#2BC48A" if rank == 0 else "rgba(43, 196, 138, 0.35)"
    else:
        val_color = "#122033"
        border = "rgba(76, 141, 255, 0.45)" if rank == 0 else "rgba(76, 141, 255, 0.2)"
    pct = d["pct"] * 100
    impact = d.get("impact", "Low")
    impact_style = "#9B1C1C" if impact == "High" and pol == "outflow" else "#122033"
    lab = html.escape(str(d["label"]))
    top = " driver-row-top" if rank == 0 else ""
    if rank == 0 and pol == "inflow":
        top += " driver-row-top-inflow"
    amt = html.escape(_format_currency(float(d["value"])))
    imp_esc = html.escape(str(impact).upper())
    return (
        f'<div class="driver-row{top}" style="border-left:3px solid {border};">'
        '<div class="driver-row-main">'
        f'<span class="driver-rank">#{rank + 1}</span>'
        f'<span class="driver-label">{lab}</span>'
        f'<span class="driver-value" style="color:{val_color};">{amt}</span>'
        "</div>"
        '<div class="driver-meta">'
        f'<span>{pct:.1f}% of total</span>'
        f'<span class="driver-impact" style="color:{impact_style};">{imp_esc} IMPACT</span>'
        "</div></div>"
    )


def drivers_section_html(drivers: list[dict[str, Any]]) -> str:
    if not drivers:
        return '<p class="driver-empty">Not enough structured rows to infer drivers—try a query that returns categories and amounts.</p>'
    parts = [driver_row_html(d, rank=i) for i, d in enumerate(drivers[:5])]
    return '<div class="drivers-list">' + "".join(parts) + "</div>"


def follow_up_chips_for_context(headline: str, drivers: list[dict[str, Any]]) -> list[str]:
    """Return 3 contextual follow-up strings (mock-friendly)."""
    chips: list[str] = []
    if drivers:
        top = drivers[0]["label"]
        chips.append(f"Why is {top} so high?")
    else:
        chips.append("What are the top cost drivers?")
    chips.append("Compare this period vs the previous one")
    if drivers and len(drivers) > 1:
        chips.append(f"Compare {drivers[0]['label']} vs {drivers[1]['label']}")
    else:
        chips.append("Show a region-wise or segment breakdown")
    # Ensure exactly 3
    seen: set[str] = set()
    out: list[str] = []
    for c in chips:
        if c not in seen:
            seen.add(c)
            out.append(c)
        if len(out) >= 3:
            break
    while len(out) < 3:
        out.append("Summarize trends in plain language")
    return out[:3]


def drill_action_labels(drivers: list[dict[str, Any]]) -> list[str]:
    actions: list[str] = []
    if drivers:
        actions.append(f"Explore {drivers[0]['label']}")
    else:
        actions.append("Explore top category")
    actions.append("Compare with prior period")
    actions.append("View category breakdown")
    return actions[:3]


def drill_actions_with_queries(drivers: list[dict[str, Any]]) -> list[tuple[str, str]]:
    """(button label, full question sent to Vantage)."""
    out: list[tuple[str, str]] = []
    if drivers:
        lab = drivers[0]["label"]
        out.append((f"Explore {lab}", f"Drill into '{lab}': show detailed breakdown, trends, and key amounts."))
    else:
        out.append(("Explore top category", "What are the top categories by amount and their share of the total?"))
    out.append(
        (
            "Compare with prior period",
            "Compare the latest period to the previous period for the same breakdown and highlight the biggest changes.",
        )
    )
    out.append(
        (
            "View category breakdown",
            "Show a full category-by-category breakdown with values and percent contribution to the total.",
        )
    )
    return out[:3]


def slugify_label(label: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_") or "item"
