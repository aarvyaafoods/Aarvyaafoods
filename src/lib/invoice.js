const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatAddress(address = {}) {
  return [
    address.fullName || address.full_name,
    address.phone,
    address.addressLine1 || address.address_line1,
    address.addressLine2 || address.address_line2,
    [address.city, address.state, address.pincode].filter(Boolean).join(', ')
  ].filter(Boolean)
}

function itemRows(order, compact = false) {
  return (order.products || []).map(item => `
    <tr>
      <td>${escapeHtml(item.name)}${compact ? '' : `<div class="muted">${escapeHtml(item.brand)} · ${escapeHtml(item.size)} · ${escapeHtml(item.color || '-')}</div>`}</td>
      <td class="center">${item.qty}</td>
      <td class="right">${money(item.unitPrice)}</td>
      <td class="right">${money((item.unitPrice || 0) * (item.qty || 0))}</td>
    </tr>
  `).join('')
}

function totalsBlock(order) {
  return `
    <div class="totals">
      <div><span>Subtotal</span><strong>${money(order.subtotal ?? order.total)}</strong></div>
      ${Number(order.discountAmount) > 0 ? `<div><span>Discount${order.promoCode ? ` (${escapeHtml(order.promoCode)})` : ''}</span><strong>-${money(order.discountAmount)}</strong></div>` : ''}
      <div><span>Shipping</span><strong>${Number(order.shippingAmount) === 0 ? 'FREE' : money(order.shippingAmount)}</strong></div>
      <div class="grand"><span>Total</span><strong>${money(order.total)}</strong></div>
    </div>
  `
}

export function buildInvoiceHtml(order, format = 'a4') {
  const thermal = format === 'thermal'
  const created = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : ''
  const addressLines = formatAddress(order.shippingAddress || {})
  const pageCss = thermal
    ? `@page { size: 80mm auto; margin: 4mm; } body { width: 72mm; font-size: 10px; } .brand { font-size: 14px; } table { font-size: 9px; }`
    : `@page { size: A4; margin: 14mm; } body { max-width: 180mm; margin: 0 auto; font-size: 12px; } .brand { font-size: 24px; }`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(order.orderNumber)}</title>
  <style>
    ${pageCss}
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; line-height: 1.45; }
    .brand { font-weight: 800; letter-spacing: 0.04em; }
    .meta { color: #666; margin: 8px 0 16px; }
    .grid { display: grid; grid-template-columns: ${thermal ? '1fr' : '1fr 1fr'}; gap: 12px; margin-bottom: 16px; }
    .box { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
    .label { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 6px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #ececec; padding: ${thermal ? '4px 2px' : '8px 6px'}; vertical-align: top; }
    th { text-align: left; font-size: 0.78em; text-transform: uppercase; letter-spacing: 0.08em; color: #666; }
    .center { text-align: center; }
    .right { text-align: right; white-space: nowrap; }
    .muted { color: #777; font-size: 0.85em; margin-top: 2px; }
    .totals { margin-top: 14px; border-top: 2px solid #111; padding-top: 10px; }
    .totals div { display: flex; justify-content: space-between; gap: 12px; margin: 4px 0; }
    .totals .grand { font-size: 1.15em; font-weight: 800; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; }
    .footer { margin-top: 18px; color: #777; font-size: 0.85em; text-align: center; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="brand">Aarvya</div>
  <div class="meta">Tax Invoice / Order Receipt · ${escapeHtml(order.orderNumber)} · ${escapeHtml(created)}</div>

  <div class="grid">
    <div class="box">
      <div class="label">Bill To</div>
      <div>${escapeHtml(order.customerName)}</div>
      <div class="muted">${escapeHtml(order.customerEmail)}</div>
      <div class="muted">${escapeHtml(order.customerPhone || '')}</div>
    </div>
    <div class="box">
      <div class="label">Ship To</div>
      ${addressLines.map(line => `<div>${escapeHtml(line)}</div>`).join('') || '<div class="muted">Address not available</div>'}
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="label">Payment</div>
      <div>${escapeHtml(order.paymentMethod || '-')} · ${escapeHtml(order.paymentStatus || '-')}</div>
    </div>
    <div class="box">
      <div class="label">Order Status</div>
      <div>${escapeHtml(order.status || '-')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows(order, thermal)}
    </tbody>
  </table>

  ${totalsBlock(order)}

  <div class="footer">Thank you for shopping with Aarvya.</div>
  <div class="no-print" style="margin-top:16px;text-align:center;">
    <button onclick="window.print()" style="padding:10px 16px;border:none;border-radius:8px;background:#111;color:#fff;font-weight:700;cursor:pointer;">Print / Save as PDF</button>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); }<\/script>
</body>
</html>`
}

export function downloadInvoice(order, format = 'a4') {
  const html = buildInvoiceHtml(order, format)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const filename = `${order.orderNumber || 'order'}-${format}-invoice.html`
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (!popup) URL.revokeObjectURL(url)
  else popup.onload = () => URL.revokeObjectURL(url)
}
