from pathlib import Path
path = Path(r"src/screens/eic/NetworkDashboard.js")
text = path.read_text()
patterns = [
    "      msTitle: {\r\n        fontSize: theme.typography.sizes.title,\r\n        fontWeight: theme.typTypography?.weightSemiBold || \"600\",\r\n        color: theme.colors.textPrimary,\r\n        marginBottom: 2,\r\n      },\r\n      msId: {\r\n        fontSize: theme.typTypography?.sizes.caption || 12,\r\n        color: theme.colors.textSecondary,\r\n        marginTop: 2,\r\n      },\r\n      msMeta: {\r\n        fontSize: theme.typTypography?.sizes.body || 14,\r\n        color: theme.colors.textSecondary,\r\n        marginTop: 2,\r\n      },\r\n",
    "      msTitle: {\r\n        fontSize: theme.typTypography?.sizes.title || 20,\r\n        fontWeight: theme.typTypography?.weightBold || \"700\",\r\n        color: theme.colors.textPrimary,\r\n        marginBottom: theme.spacing(0.05),\r\n      },\r\n      msId: {\r\n        fontSize: theme.typTypography?.sizes.caption || 12,\r\n        color: theme.colors.textSecondary,\r\n        marginTop: theme.spacing(0.05),\r\n      },\r\n      msMeta: {\r\n        fontSize: theme.typTypography?.sizes.body || 14,\r\n        color: theme.colors.textSecondary,\r\n        marginTop: theme.spacing(0.05),\r\n      },\r\n"
]
for block in patterns:
    if block in text:
        text = text.replace(block, "")
        break
else:
    raise SystemExit("ms block not found")
path.write_text(text)

