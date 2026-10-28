/**
 * One booking goes to one professional. When the cart holds jobs from two trades
 * (say electrical and plumbing), say so before checkout rather than after.
 * Returns null when the cart is a single trade.
 */
export function cartTrades(lines, categories) {
  const ids = [...new Set(lines.map((l) => l.category_id))];
  return ids.map((id) => categories.find((c) => c.id === id)?.name || id);
}

export default function MixedTradeNotice({ lines, categories }) {
  const trades = cartTrades(lines, categories || []);
  if (trades.length < 2) return null;
  return (
    <div className="notice error mt16">
      Your cart has jobs for {trades.join(" and ")}. Each trade is done by a different professional,
      so book one trade now and the other after — remove the extra items to continue.
    </div>
  );
}
