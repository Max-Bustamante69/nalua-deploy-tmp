// PDP interactivity for the redesign (loaded by sections/main-product.liquid).
// Self-contained, no library: gallery thumbs, qty stepper, AJAX add-to-cart that
// opens the cart drawer (cart:updated + cart:open), and a scroll-in sticky bar.
(() => {
  function initPdp(root) {
    if (!root || root.dataset.pdpInit) return
    root.dataset.pdpInit = '1'
    const $ = (s, c = root) => c.querySelector(s)
    const $$ = (s, c = root) => [...c.querySelectorAll(s)]

    // Gallery thumbs
    const main = $('[data-pdp-main]')
    $$('[data-pdp-thumb]').forEach((t) =>
      t.addEventListener('click', () => {
        if (!main) return
        main.src = t.dataset.src
        if (t.dataset.srcset) main.srcset = t.dataset.srcset
        $$('[data-pdp-thumb]').forEach((x) => x.classList.replace('border-ink', 'border-transparent'))
        t.classList.replace('border-transparent', 'border-ink')
      }),
    )

    // Quantity stepper
    let qty = 1
    const qtyVal = $('[data-pdp-qty-val]')
    $$('[data-pdp-qty]').forEach((b) =>
      b.addEventListener('click', () => {
        qty = Math.max(1, qty + parseInt(b.dataset.pdpQty, 10))
        if (qtyVal) qtyVal.textContent = qty
      }),
    )

    // Add to cart (main + sticky bar)
    async function add(btn) {
      const id = btn.dataset.variant
      const q = btn.closest('[data-pdp-info]') || btn.closest('[data-pdp-bar]') ? qty : 1
      const label = $('[data-pdp-atc-label]', btn) || btn
      const prev = label.textContent
      btn.disabled = true
      label.textContent = '…'
      try {
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, quantity: q }),
        })
        const cart = await (await fetch('/cart.js')).json()
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }))
        document.dispatchEvent(new CustomEvent('cart:open'))
      } catch (e) {
        label.textContent = 'Error'
      } finally {
        setTimeout(() => {
          btn.disabled = false
          label.textContent = prev
        }, 900)
      }
    }
    $$('[data-pdp-atc]').forEach((b) => b.addEventListener('click', () => add(b)))

    // Sticky add-to-cart bar
    const bar = $('[data-pdp-bar]')
    const info = $('[data-pdp-info]')
    if (bar && info && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => bar.classList.toggle('translate-y-full', e.isIntersecting), {
        rootMargin: '-120px 0px 0px 0px',
      }).observe(info)
    }
  }

  function boot() {
    document.querySelectorAll('[data-pdp]').forEach(initPdp)
  }
  if (document.readyState !== 'loading') boot()
  else document.addEventListener('DOMContentLoaded', boot)
  document.addEventListener('shopify:section:load', boot)
})()
