from pathlib import Path
path = Path(r"src/screens/eic/NetworkDashboard.js")
text = path.read_text(encoding="utf-8")
block = "      dbSummaryChip: {\n        flex: 1,\n        backgroundColor: theme.colors.surfaceElevated,\n        borderRadius: theme.radii.sm,\n        paddingVertical: theme.spacing(1.5),\n        paddingHorizontal: theme.spacing(2),\n        alignItems: \"center\",\n      },\n      dbSummaryValue: {\n        fontSize: theme.typography?.sizes.body || 14,\n        fontWeight: theme.typTypography?.weightSemiBold || \"600\",\n        color: theme.colors.textPrimary,\n      },\n      nextTrip: {\n        marginTop: theme.spacing(1.5),\n        fontSize: theme.typTypography?.sizes.caption || 12,\n        color: theme.colors.textSecondary,\n      },\n"
if block in text:
    text = text.replace(block, "")
else:
    raise SystemExit("block not found")
path.write_text(text, encoding="utf-8")
