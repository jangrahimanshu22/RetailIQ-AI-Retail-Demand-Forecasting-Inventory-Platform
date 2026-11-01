"""
reports.py
API router for automated report generation in PDF, Excel (.xlsx), and CSV formats.
Includes Executive Sales Performance, Demand Forecast, Model Evaluation, and Inventory reports.
"""
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response, FileResponse
import pandas as pd
import numpy as np
import io
import json
from datetime import datetime

from backend.services.data_manager import data_manager, MODEL_DIR, REPORTS_DIR
from utils.inventory_engine import generate_business_insights

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable

router = APIRouter(prefix="/api/reports", tags=["Reports & Export"])

@router.get("/list")
def list_available_reports():
    return [
        {
            "id": "sales_performance",
            "title": "Sales Performance Report",
            "description": "Comprehensive sales trends, revenue distribution by category/store, and top performing SKUs.",
            "formats": ["pdf", "xlsx", "csv"]
        },
        {
            "id": "model_evaluation",
            "title": "ML Model Evaluation Report",
            "description": "Benchmark metrics (MAE, RMSE, MSE, MAPE, R², CV RMSE) comparing 7 regression algorithms.",
            "formats": ["pdf", "xlsx", "csv"]
        },
        {
            "id": "inventory_recommendation",
            "title": "Inventory Optimization & Restock Report",
            "description": "Safety stock, reorder thresholds, critical stockout alerts, and recommended restock units.",
            "formats": ["pdf", "xlsx", "csv"]
        },
        {
            "id": "business_intelligence",
            "title": "Executive Business Intelligence Insights",
            "description": "Automated actionable insights, promotional uplift, seasonal opportunities, and category velocity.",
            "formats": ["pdf", "xlsx"]
        }
    ]

@router.get("/export")
def export_report(
    report_type: str = Query(..., pattern="^(sales_performance|model_evaluation|inventory_recommendation|business_intelligence)$"),
    format: str = Query("pdf", pattern="^(pdf|xlsx|csv)$")
):
    clean_df = data_manager.get_clean_df()
    if clean_df.empty:
        clean_df = data_manager.get_raw_df()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")

    # --- 1. MODEL EVALUATION REPORT ---
    if report_type == "model_evaluation":
        comp_path = MODEL_DIR / "model_comparison.csv"
        if not comp_path.exists():
            raise HTTPException(status_code=400, detail="No model comparison found. Please run model training first.")
        comp_df = pd.read_csv(comp_path)

        if format == "csv":
            content = comp_df.to_csv(index=False).encode("utf-8")
            return Response(content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=model_evaluation_{timestamp}.csv"})

        elif format == "xlsx":
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
                comp_df.to_excel(writer, sheet_name="Model_Comparison", index=False)
            return Response(buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            headers={"Content-Disposition": f"attachment; filename=model_evaluation_{timestamp}.xlsx"})

        elif format == "pdf":
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
            styles = getSampleStyleSheet()
            elements = []

            # Header
            elements.append(Paragraph("<b>RetailIQ — Machine Learning Model Evaluation Report</b>", styles["Title"]))
            elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} | Enterprise AI Platform", styles["Normal"]))
            elements.append(Spacer(1, 15))
            elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=15))

            elements.append(Paragraph("<b>Executive Summary:</b>", styles["Heading2"]))
            best_model_name = comp_df.iloc[0]["Model"]
            best_rmse = comp_df.iloc[0]["RMSE"]
            best_r2 = comp_df.iloc[0]["R2"]
            summary_text = (
                f"Seven machine learning regression algorithms were trained and evaluated on historical retail demand patterns "
                f"using time-series cross validation. <b>{best_model_name}</b> emerged as the top performer with an RMSE of <b>{best_rmse}</b> "
                f"and R² Score of <b>{best_r2}</b>."
            )
            elements.append(Paragraph(summary_text, styles["Normal"]))
            elements.append(Spacer(1, 15))

            # Table
            table_data = [list(comp_df.columns)]
            for _, r in comp_df.iterrows():
                table_data.append([str(val) for val in r.values])

            t = Table(table_data, colWidths=[110, 60, 60, 60, 60, 60, 65, 65])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E1B4B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]))
            elements.append(t)
            doc.build(elements)
            return Response(buffer.getvalue(), media_type="application/pdf",
                            headers={"Content-Disposition": f"attachment; filename=model_evaluation_{timestamp}.pdf"})

    # --- 2. SALES PERFORMANCE REPORT ---
    elif report_type == "sales_performance":
        if clean_df.empty:
            raise HTTPException(status_code=400, detail="No dataset loaded.")
        
        # Aggregate summary
        total_rev = clean_df["Revenue"].sum() if "Revenue" in clean_df.columns else 0
        total_qty = clean_df["Sales_Quantity"].sum() if "Sales_Quantity" in clean_df.columns else 0
        cat_summary = clean_df.groupby("Category").agg({"Sales_Quantity": "sum", "Revenue": "sum"}).reset_index()

        if format == "csv":
            content = cat_summary.to_csv(index=False).encode("utf-8")
            return Response(content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=sales_summary_{timestamp}.csv"})

        elif format == "xlsx":
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
                cat_summary.to_excel(writer, sheet_name="Category_Sales", index=False)
                clean_df.head(1000).to_excel(writer, sheet_name="Recent_Sales_Sample", index=False)
            return Response(buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            headers={"Content-Disposition": f"attachment; filename=sales_performance_{timestamp}.xlsx"})

        elif format == "pdf":
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
            styles = getSampleStyleSheet()
            elements = []

            elements.append(Paragraph("<b>RetailIQ — Executive Sales Performance Report</b>", styles["Title"]))
            elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} | Enterprise Retail Intelligence", styles["Normal"]))
            elements.append(Spacer(1, 15))
            elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=15))

            kpi_p = f"<b>Total Revenue:</b> ${total_rev:,.2f} &nbsp;|&nbsp; <b>Total Units Sold:</b> {total_qty:,} &nbsp;|&nbsp; <b>SKUs Tracked:</b> {clean_df['Product_ID'].nunique()}"
            elements.append(Paragraph(kpi_p, styles["Heading3"]))
            elements.append(Spacer(1, 15))

            elements.append(Paragraph("<b>Category-Wise Sales Contribution:</b>", styles["Heading2"]))
            cat_data = [["Category", "Total Units", "Total Revenue ($)"]]
            for _, r in cat_summary.iterrows():
                cat_data.append([str(r["Category"]), f"{int(r['Sales_Quantity']):,}", f"${r['Revenue']:,.2f}"])

            t = Table(cat_data, colWidths=[200, 150, 150])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E1B4B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ]))
            elements.append(t)
            doc.build(elements)
            return Response(buffer.getvalue(), media_type="application/pdf",
                            headers={"Content-Disposition": f"attachment; filename=sales_performance_{timestamp}.pdf"})

    # --- 3. INVENTORY RECOMMENDATION REPORT ---
    elif report_type == "inventory_recommendation":
        from backend.api.inventory import get_inventory_recommendations
        inv_data = get_inventory_recommendations()
        items_df = pd.DataFrame(inv_data["items"])

        if format == "csv":
            content = items_df.to_csv(index=False).encode("utf-8")
            return Response(content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=inventory_recommendations_{timestamp}.csv"})

        elif format == "xlsx":
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
                items_df.to_excel(writer, sheet_name="Inventory_Plan", index=False)
            return Response(buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            headers={"Content-Disposition": f"attachment; filename=inventory_recommendations_{timestamp}.xlsx"})

        elif format == "pdf":
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
            styles = getSampleStyleSheet()
            elements = []

            elements.append(Paragraph("<b>RetailIQ — Inventory Optimization & Restock Advisory</b>", styles["Title"]))
            elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} | Enterprise Supply Chain Intelligence", styles["Normal"]))
            elements.append(Spacer(1, 15))
            elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#DC2626"), spaceAfter=15))

            summary = inv_data["summary"]
            sum_text = (
                f"<b>Critical Stockouts:</b> {summary['critical_count']} &nbsp;|&nbsp; "
                f"<b>Low Stock Warning:</b> {summary['low_stock_count']} &nbsp;|&nbsp; "
                f"<b>Healthy:</b> {summary['healthy_count']} &nbsp;|&nbsp; "
                f"<b>Total Units to Restock:</b> {summary['total_recommended_restock']:,.0f}"
            )
            elements.append(Paragraph(sum_text, styles["Normal"]))
            elements.append(Spacer(1, 15))

            # Critical table
            crit_df = items_df[items_df["Status"] == "Critical"].head(15)
            if not crit_df.empty:
                elements.append(Paragraph("<b>High-Priority Restock Actions (Stockout Risk):</b>", styles["Heading2"]))
                t_data = [["Product", "Store", "Current Stock", "Reorder Pt", "Restock Qty", "Alert"]]
                for _, r in crit_df.iterrows():
                    t_data.append([str(r["Product_Name"])[:18], str(r["Store_ID"]), str(r["Current_Inventory"]),
                                   str(r["Reorder_Point"]), str(r["Recommended_Restock_Qty"]), str(r["Alert"])])

                t = Table(t_data, colWidths=[140, 60, 80, 80, 80, 90])
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#991B1B")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FEF2F2")]),
                    ("ALIGN", (2, 0), (4, -1), "RIGHT"),
                ]))
                elements.append(t)

            doc.build(elements)
            return Response(buffer.getvalue(), media_type="application/pdf",
                            headers={"Content-Disposition": f"attachment; filename=inventory_recommendations_{timestamp}.pdf"})

    # --- 4. BUSINESS INTELLIGENCE REPORT ---
    elif report_type == "business_intelligence":
        from backend.api.insights import get_business_insights
        bi_data = get_business_insights()

        if format == "xlsx":
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
                pd.DataFrame(bi_data["best_selling"]).to_excel(writer, sheet_name="Top_Products", index=False)
                pd.DataFrame(bi_data["category_breakdown"]).to_excel(writer, sheet_name="Categories", index=False)
                pd.DataFrame(bi_data["store_efficiency"]).to_excel(writer, sheet_name="Stores", index=False)
            return Response(buffer.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            headers={"Content-Disposition": f"attachment; filename=business_intelligence_{timestamp}.xlsx"})

        elif format == "pdf":
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
            styles = getSampleStyleSheet()
            elements = []

            elements.append(Paragraph("<b>RetailIQ — Automated Business Intelligence Digest</b>", styles["Title"]))
            elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} | Strategic BI Report", styles["Normal"]))
            elements.append(Spacer(1, 15))
            elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=15))

            elements.append(Paragraph("<b>Key Strategic Findings:</b>", styles["Heading2"]))
            elements.append(Paragraph(f"• <b>Fastest-moving category:</b> {bi_data.get('top_category', 'N/A')}", styles["Normal"]))
            if bi_data.get("promotion_elasticity"):
                elements.append(Paragraph(f"• <b>Promotional Elasticity:</b> {bi_data['promotion_elasticity']['conclusion']}", styles["Normal"]))
            elements.append(Spacer(1, 15))

            elements.append(Paragraph("<b>Top Revenue Generating Products:</b>", styles["Heading2"]))
            top_p_data = [["Product ID", "Product Name", "Total Revenue ($)"]]
            for p in bi_data.get("high_revenue_products", []):
                top_p_data.append([str(p.get("Product_ID")), str(p.get("Product_Name")), f"${p.get('Revenue', 0):,.2f}"])

            t = Table(top_p_data, colWidths=[120, 240, 140])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E1B4B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
            ]))
            elements.append(t)
            doc.build(elements)
            return Response(buffer.getvalue(), media_type="application/pdf",
                            headers={"Content-Disposition": f"attachment; filename=business_intelligence_{timestamp}.pdf"})

    raise HTTPException(status_code=400, detail="Invalid report type or format.")
