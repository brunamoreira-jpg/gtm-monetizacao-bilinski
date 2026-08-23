import './style.css'
import PRODUCTS from './products.json'
import JOURNEYS from './journeys.json'
import heroImg from './assets/porsche-hero.png'
import trackImg from './assets/porsche-track.png'
import sideImg from './assets/porsche-side.png'
import garageImg from './assets/porsche-garage.png'
import v4Logo from './assets/v4-logo.webp'

const TERRITORIES = {
  aquisicao: { num: '01', en: 'ACQUIRE', pt: 'Aquisição', verb: 'Gerar demanda', kpi: 'CAC · CPL · Pipeline' },
  conversao: { num: '02', en: 'CONVERT', pt: 'Conversão', verb: 'Transformar demanda em receita', kpi: 'CVR · Win Rate' },
  retencao: { num: '03', en: 'RETAIN', pt: 'Retenção', verb: 'Proteger receita', kpi: 'Churn · LTV' },
  monetizacao: { num: '04', en: 'EXPAND', pt: 'Monetização', verb: 'Extrair mais valor da carteira', kpi: 'NRR · Ticket' },
  gestao: { num: '05', en: 'OPERATE', pt: 'Gestão', verb: 'Criar capacidade de crescimento', kpi: 'Forecast · SLA' }
}

const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]))
const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

$('#heroImage').src = heroImg
$('#ctaImage').src = trackImg
$('#v4Logo').src = v4Logo

let portfolioState = { type: 'all', territory: 'all', query: '', expanded: false }
let activeJourney = JOURNEYS[2]
let journeyLevel = 'medio'
let activeProductId = null

const levelCopy = {
  basico: 'Entrada objetiva para resolver a trava com menor complexidade e menor investimento.',
  medio: 'Equilíbrio entre profundidade, velocidade e capacidade de execução.',
  avancado: 'Maior profundidade, governança e amplitude para clientes com maior potencial de receita.'
}

function setBodyLock(locked) {
  document.body.classList.toggle('modal-open', locked)
}

function showToast(message) {
  const toast = $('#toast')
  toast.textContent = message
  toast.classList.add('is-open')
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => toast.classList.remove('is-open'), 1800)
}

function renderTerritories() {
  const rail = $('#territoryRail')
  rail.innerHTML = ''
  Object.entries(TERRITORIES).forEach(([key, territory]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'territory-item'
    button.innerHTML = `
      <span class="territory-number">${territory.num}</span>
      <span>
        <span class="territory-name">${territory.en}</span>
        <span class="mt-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">${territory.pt}</span>
      </span>
      <span class="territory-copy">${territory.verb}<br><span class="text-white/25">${territory.kpi}</span></span>
      <span class="territory-arrow">↘</span>
    `
    button.addEventListener('click', () => {
      portfolioState.territory = key
      portfolioState.type = 'all'
      portfolioState.query = ''
      portfolioState.expanded = true
      $('#portfolioSearch').value = ''
      syncPortfolioControls()
      renderProducts()
      $('#portfolio').scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    rail.appendChild(button)
  })
}

function renderTerritoryFilters() {
  const host = $('#territoryFilters')
  host.innerHTML = ''
  const all = document.createElement('button')
  all.type = 'button'
  all.className = 'territory-filter is-active'
  all.dataset.territory = 'all'
  all.textContent = 'Todos os territórios'
  host.appendChild(all)
  Object.entries(TERRITORIES).forEach(([key, territory]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'territory-filter'
    button.dataset.territory = key
    button.textContent = territory.pt
    host.appendChild(button)
  })
  host.addEventListener('click', event => {
    const button = event.target.closest('[data-territory]')
    if (!button) return
    portfolioState.territory = button.dataset.territory
    portfolioState.expanded = true
    syncPortfolioControls()
    renderProducts()
  })
}

function syncPortfolioControls() {
  $$('#typeFilters [data-type]').forEach(button => button.classList.toggle('is-active', button.dataset.type === portfolioState.type))
  $$('#territoryFilters [data-territory]').forEach(button => button.classList.toggle('is-active', button.dataset.territory === portfolioState.territory))
}

function searchableText(product) {
  return normalize([
    product.id,
    product.name,
    product.tag,
    product.desc,
    product.why,
    TERRITORIES[product.territory]?.pt,
    ...(product.when || []),
    ...(product.impact || [])
  ].join(' '))
}

function getFilteredProducts() {
  let list = [...PRODUCTS]
  if (portfolioState.type !== 'all') list = list.filter(p => p.type === portfolioState.type)
  if (portfolioState.territory !== 'all') list = list.filter(p => p.territory === portfolioState.territory)
  if (portfolioState.query.trim()) {
    const terms = normalize(portfolioState.query).split(/\s+/).filter(Boolean)
    list = list.filter(p => terms.every(term => searchableText(p).includes(term)))
  }

  list.sort((a, b) => {
    if (a.id === 'P08') return -1
    if (b.id === 'P08') return 1
    if (a.type !== b.type) return a.type === 'recorrente' ? -1 : 1
    return a.id.localeCompare(b.id, 'pt-BR', { numeric: true })
  })
  return list
}

function renderProducts() {
  const all = getFilteredProducts()
  const isBroadView = portfolioState.type === 'all' && portfolioState.territory === 'all' && !portfolioState.query.trim()
  const visible = isBroadView && !portfolioState.expanded ? all.slice(0, 12) : all
  const list = $('#productList')
  list.innerHTML = ''

  visible.forEach(product => {
    const prices = Object.values(product.plans).map(plan => plan.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'product-row'
    row.dataset.productId = product.id
    row.innerHTML = `
      <span class="product-code">${product.id}</span>
      <span>
        <span class="product-name">${product.name}${product.id === 'P08' ? '<span class="seasonal-badge">SAZONAL · AGO A NOV</span>' : ''}</span>
        <span class="product-tag">${product.tag || product.desc}</span>
      </span>
      <span class="product-territory">${product.type === 'recorrente' ? 'Recorrente' : 'Pontual'}<strong>${TERRITORIES[product.territory].pt}</strong></span>
      <span class="product-price"><span>Investimento</span><strong>${money(min)} → ${money(max)}</strong></span>
      <span class="product-arrow">↗</span>
    `
    row.addEventListener('click', () => openDrawer(product.id))
    list.appendChild(row)
  })

  $('#productEmpty').classList.toggle('hidden', all.length > 0)
  $('#productList').classList.toggle('hidden', all.length === 0)
  $('#portfolioCount').textContent = `${all.length} ${all.length === 1 ? 'produto' : 'produtos'}`

  const showAll = $('#showAllProducts')
  const shouldShow = isBroadView && all.length > 12 && !portfolioState.expanded
  showAll.classList.toggle('hidden', !shouldShow)
  showAll.textContent = `Ver todos os ${all.length} produtos`
}

function bindPortfolio() {
  $('#typeFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-type]')
    if (!button) return
    portfolioState.type = button.dataset.type
    portfolioState.expanded = true
    syncPortfolioControls()
    renderProducts()
  })

  $('#portfolioSearch').addEventListener('input', event => {
    portfolioState.query = event.target.value
    portfolioState.expanded = true
    renderProducts()
  })

  $('#clearFilters').addEventListener('click', () => {
    portfolioState = { type: 'all', territory: 'all', query: '', expanded: false }
    $('#portfolioSearch').value = ''
    syncPortfolioControls()
    renderProducts()
  })

  $('#showAllProducts').addEventListener('click', () => {
    portfolioState.expanded = true
    renderProducts()
  })
}

function openDrawer(id) {
  const product = byId[id]
  if (!product) return
  activeProductId = id
  const drawer = $('#productDrawer')
  const scrim = $('#drawerScrim')

  $('#drawerMeta').textContent = `${product.id} · ${product.type === 'recorrente' ? 'Recorrente' : 'Pontual'} · ${TERRITORIES[product.territory].pt}${product.id === 'P08' ? ' · Sazonal' : ''}`

  const plans = ['basico', 'medio', 'avancado'].map(level => {
    const plan = product.plans[level]
    return `
      <div class="plan-line">
        <div class="plan-name">${plan.label}</div>
        <div class="plan-items">${plan.lines.join(' · ')}</div>
        <div class="plan-price">${money(plan.price)}${product.type === 'recorrente' ? '<small class="block mt-1 text-[8px] uppercase tracking-[0.12em] text-white/30">por mês</small>' : ''}</div>
      </div>
    `
  }).join('')

  const nextLinks = (product.next || []).map(nextId => byId[nextId]).filter(Boolean).map(next => `
    <button class="next-link" data-next-product="${next.id}" type="button">
      <span>${next.id} · ${next.name}</span><b>↗</b>
    </button>
  `).join('')

  $('#drawerContent').innerHTML = `
    <h2 class="drawer-title">${product.name}</h2>
    <p class="drawer-description">${product.desc}</p>

    <section class="drawer-section">
      <h3 class="drawer-section-title">Quando vender</h3>
      <ul class="drawer-list">${product.when.map(item => `<li>${item}</li>`).join('')}</ul>
    </section>

    <section class="drawer-section">
      <h3 class="drawer-section-title">Impacto esperado</h3>
      <ul class="drawer-list">${product.impact.map(item => `<li>${item}</li>`).join('')}</ul>
    </section>

    <section class="drawer-section">
      <h3 class="drawer-section-title">Por que vender</h3>
      <div class="drawer-why">${product.why}</div>
    </section>

    <section class="drawer-section">
      <h3 class="drawer-section-title">Planos</h3>
      <div class="mt-3">${plans}</div>
      ${product.notes ? `<p class="mt-5 text-xs leading-6 text-white/35">${product.notes}</p>` : ''}
    </section>

    <section class="drawer-section">
      <h3 class="drawer-section-title">Como o Account apresenta</h3>
      <div class="drawer-why">“${product.talk}”</div>
    </section>

    <section class="drawer-section">
      <h3 class="drawer-section-title">Próxima oportunidade</h3>
      <div class="mt-3">${nextLinks || '<p class="text-sm text-white/40">Sem rota cadastrada.</p>'}</div>
    </section>
  `

  $$('[data-next-product]', $('#drawerContent')).forEach(button => {
    button.addEventListener('click', () => openDrawer(button.dataset.nextProduct))
  })

  drawer.classList.add('is-open')
  drawer.setAttribute('aria-hidden', 'false')
  scrim.classList.add('is-open')
  scrim.setAttribute('aria-hidden', 'false')
  setBodyLock(true)
}

function closeDrawer() {
  activeProductId = null
  $('#productDrawer').classList.remove('is-open')
  $('#productDrawer').setAttribute('aria-hidden', 'true')
  $('#drawerScrim').classList.remove('is-open')
  $('#drawerScrim').setAttribute('aria-hidden', 'true')
  setBodyLock(false)
}

function routeStage(index, length, product) {
  if (index === 0) return 'Destravar'
  if (index === length - 1) return 'Expandir'
  if (product.type === 'pontual') return 'Estruturar'
  return 'Sustentar'
}

function calculateRoute(journey) {
  let oneOff = 0
  let mrr = 0
  const steps = journey.route.map((id, index) => {
    const product = byId[id]
    const plan = product.plans[journeyLevel]
    if (product.type === 'recorrente') mrr += plan.price
    else oneOff += plan.price
    return { product, plan, stage: routeStage(index, journey.route.length, product) }
  })
  return { steps, oneOff, mrr, ninety: oneOff + mrr * 3 }
}

function renderRoute({ openMobile = false } = {}) {
  const route = calculateRoute(activeJourney)
  $('#routeHint').textContent = activeJourney.hint
  $('#levelHelp').textContent = levelCopy[journeyLevel]
  const host = $('#routeSteps')
  host.innerHTML = ''

  route.steps.forEach((step, index) => {
    const row = document.createElement('div')
    row.className = 'route-step'
    row.style.animationDelay = `${index * 45}ms`
    row.innerHTML = `
      <span class="route-step-index">0${index + 1}</span>
      <span>
        <span class="route-step-label">${step.stage}</span>
        <strong class="route-step-name">${step.product.id} · ${step.product.name}</strong>
      </span>
      <span class="route-step-price">
        <span>${step.product.type === 'recorrente' ? 'MRR' : 'Pontual'} · ${step.plan.label}</span>
        <strong>${money(step.plan.price)}</strong>
      </span>
      <button class="route-open" data-route-product="${step.product.id}" type="button" aria-label="Abrir ${step.product.name}">↗</button>
    `
    host.appendChild(row)
  })

  $('#routeOneOff').textContent = money(route.oneOff)
  $('#routeMrr').textContent = money(route.mrr)
  $('#route90').textContent = money(route.ninety)

  $$('[data-route-product]', host).forEach(button => button.addEventListener('click', () => openDrawer(button.dataset.routeProduct)))

  renderMobileRoute(route)
  if (openMobile && window.innerWidth < 900) openRouteSheet()
}

function renderPainList() {
  const host = $('#painList')
  host.innerHTML = ''
  JOURNEYS.forEach((journey, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `pain-button${journey.id === activeJourney.id ? ' is-active' : ''}`
    button.dataset.journey = journey.id
    button.innerHTML = `
      <span class="pain-num">${String(index + 1).padStart(2, '0')}</span>
      <span class="pain-label">${journey.label}</span>
      <span class="pain-arrow">→</span>
    `
    button.addEventListener('click', () => {
      activeJourney = journey
      $$('.pain-button').forEach(item => item.classList.toggle('is-active', item.dataset.journey === journey.id))
      renderRoute({ openMobile: true })
    })
    host.appendChild(button)
  })
}

function bindLevels() {
  $$('#levelTabs [data-level]').forEach(button => {
    button.addEventListener('click', () => {
      journeyLevel = button.dataset.level
      $$('#levelTabs [data-level]').forEach(item => item.classList.toggle('is-active', item.dataset.level === journeyLevel))
      renderRoute({ openMobile: true })
    })
  })
}

function renderMobileRoute(route) {
  $('#sheetTitle').textContent = `${activeJourney.label} · ${byId[activeJourney.route[0]].plans[journeyLevel].label}`
  $('#sheetSteps').innerHTML = route.steps.map((step, index) => `
    <button class="sheet-step w-full bg-transparent text-left" data-sheet-product="${step.product.id}" type="button">
      <small>0${index + 1}</small>
      <span><small class="!text-white/30">${step.stage}</small><strong class="mt-1">${step.product.name}</strong></span>
      <span>${money(step.plan.price)}</span>
    </button>
  `).join('')
  $('#sheetSummary').innerHTML = `
    <div class="grid grid-cols-2 gap-5">
      <div><span class="micro-label">Pontual</span><strong class="mt-2 block text-xl">${money(route.oneOff)}</strong></div>
      <div><span class="micro-label">MRR potencial</span><strong class="mt-2 block text-xl text-v4-red">${money(route.mrr)}</strong></div>
    </div>
    <div class="mt-6 border-t border-white/10 pt-5"><span class="micro-label">Valor em 90 dias</span><strong class="mt-2 block text-2xl">${money(route.ninety)}</strong></div>
  `
  $$('[data-sheet-product]').forEach(button => button.addEventListener('click', () => {
    closeRouteSheet()
    openDrawer(button.dataset.sheetProduct)
  }))
}

function openRouteSheet() {
  $('#routeSheet').classList.add('is-open')
  $('#routeSheet').setAttribute('aria-hidden', 'false')
  $('#routeSheetScrim').classList.add('is-open')
  $('#routeSheetScrim').setAttribute('aria-hidden', 'false')
  setBodyLock(true)
}

function closeRouteSheet() {
  $('#routeSheet').classList.remove('is-open')
  $('#routeSheet').setAttribute('aria-hidden', 'true')
  $('#routeSheetScrim').classList.remove('is-open')
  $('#routeSheetScrim').setAttribute('aria-hidden', 'true')
  setBodyLock(false)
}

async function copyRoute() {
  const route = calculateRoute(activeJourney)
  const lines = route.steps.map((step, index) => `${index + 1}. ${step.stage}: ${step.product.id} ${step.product.name} · ${step.plan.label} · ${money(step.plan.price)}${step.product.type === 'recorrente' ? '/mês' : ''}`)
  const text = [
    'GTM Monetização Bilinski&Co.',
    `Trava: ${activeJourney.label}`,
    `Nível: ${byId[activeJourney.route[0]].plans[journeyLevel].label}`,
    '',
    ...lines,
    '',
    `Pontual: ${money(route.oneOff)}`,
    `MRR potencial: ${money(route.mrr)}`,
    `Valor em 90 dias: ${money(route.ninety)}`
  ].join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  showToast('Rota copiada')
}

function renderDiagnostic() {
  const select = $('#diagSelect')
  select.innerHTML = JOURNEYS.map(journey => `<option value="${journey.id}">${journey.label}</option>`).join('')
  select.value = activeJourney.id
  updateDiagnostic(activeJourney)
  select.addEventListener('change', () => {
    const journey = JOURNEYS.find(item => item.id === select.value)
    updateDiagnostic(journey)
  })
}

function updateDiagnostic(journey) {
  const first = byId[journey.route[0]]
  $('#diagProduct').textContent = `${first.id} ${first.name}`
  $('#diagCopy').textContent = first.why
  $('#diagRoute').textContent = journey.route.slice(1).map(id => byId[id].name).join(' → ')
  $('#diagProduct').onclick = () => openDrawer(first.id)
  $('#diagSendBuilder').onclick = () => {
    activeJourney = journey
    $$('.pain-button').forEach(item => item.classList.toggle('is-active', item.dataset.journey === journey.id))
    renderRoute()
    $('#journey').scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function scoreSearch(product, query) {
  if (!query.trim()) return 1
  const normalized = normalize(query)
  const terms = normalized.split(/\s+/).filter(Boolean)
  const name = normalize(product.name)
  const id = normalize(product.id)
  const haystack = searchableText(product)
  return terms.reduce((score, term) => {
    if (id === term) score += 12
    if (name.includes(term)) score += 6
    if (haystack.includes(term)) score += 1
    return score
  }, 0)
}

function renderGlobalSearch(query = '') {
  const results = PRODUCTS
    .map(product => ({ product, score: scoreSearch(product, query) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, 12)

  const host = $('#searchResults')
  if (!results.length) {
    host.innerHTML = '<div class="py-12 text-sm text-white/40">Nenhum produto encontrado. Tente por churn, CRM, leads, pricing ou Black Friday.</div>'
    return
  }
  host.innerHTML = results.map(({ product }) => {
    const min = Math.min(...Object.values(product.plans).map(plan => plan.price))
    return `
      <button class="search-result" data-search-product="${product.id}" type="button">
        <span class="search-code">${product.id}</span>
        <span><strong class="search-name">${product.name}</strong><small class="search-meta">${TERRITORIES[product.territory].pt} · ${product.type === 'recorrente' ? 'Recorrente' : 'Pontual'}</small></span>
        <span class="search-price">${money(min)}</span>
        <span class="text-white/25">↗</span>
      </button>
    `
  }).join('')
  $$('[data-search-product]', host).forEach(button => button.addEventListener('click', () => {
    closeSearch()
    openDrawer(button.dataset.searchProduct)
  }))
}

function openSearch() {
  $('#searchModal').classList.add('is-open')
  $('#searchModal').setAttribute('aria-hidden', 'false')
  setBodyLock(true)
  renderGlobalSearch('')
  setTimeout(() => $('#globalSearch').focus(), 60)
}

function closeSearch() {
  $('#searchModal').classList.remove('is-open')
  $('#searchModal').setAttribute('aria-hidden', 'true')
  $('#globalSearch').value = ''
  setBodyLock(false)
}

function openMenu() {
  $('#mobileMenu').classList.add('is-open')
  $('#mobileMenu').setAttribute('aria-hidden', 'false')
  setBodyLock(true)
}
function closeMenu() {
  $('#mobileMenu').classList.remove('is-open')
  $('#mobileMenu').setAttribute('aria-hidden', 'true')
  setBodyLock(false)
}

function bindOverlays() {
  $('#drawerClose').addEventListener('click', closeDrawer)
  $('#drawerScrim').addEventListener('click', closeDrawer)
  $('#routeSheetScrim').addEventListener('click', closeRouteSheet)
  $('#sheetClose').addEventListener('click', closeRouteSheet)
  $('#searchOpen').addEventListener('click', openSearch)
  $('#searchClose').addEventListener('click', closeSearch)
  $('#globalSearch').addEventListener('input', event => renderGlobalSearch(event.target.value))
  $('#searchModal').addEventListener('click', event => { if (event.target === $('#searchModal')) closeSearch() })
  $('#menuOpen').addEventListener('click', openMenu)
  $('#menuClose').addEventListener('click', closeMenu)
  $$('.mobile-nav-link').forEach(link => link.addEventListener('click', closeMenu))
  $('#copyRoute').addEventListener('click', copyRoute)

  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      openSearch()
    }
    if (event.key === 'Escape') {
      if ($('#searchModal').classList.contains('is-open')) closeSearch()
      else if ($('#productDrawer').classList.contains('is-open')) closeDrawer()
      else if ($('#routeSheet').classList.contains('is-open')) closeRouteSheet()
      else if ($('#mobileMenu').classList.contains('is-open')) closeMenu()
    }
  })
}

function setupScrollUI() {
  const header = $('#siteHeader')
  const progress = $('#scrollProgress')
  const navLinks = $$('.nav-link')
  const sections = ['portfolio', 'journey', 'diagnostico'].map(id => document.getElementById(id))

  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 28)
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`

    let activeId = ''
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= 180) activeId = section.id
    })
    navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`))
  }
  window.addEventListener('scroll', update, { passive: true })
  update()

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible')
    })
  }, { threshold: .08 })
  $$('.section-intro, .diagnostic-layout').forEach(element => {
    element.classList.add('reveal')
    observer.observe(element)
  })
}

function init() {
  renderTerritories()
  renderTerritoryFilters()
  bindPortfolio()
  syncPortfolioControls()
  renderProducts()
  renderPainList()
  bindLevels()
  renderRoute()
  renderDiagnostic()
  bindOverlays()
  setupScrollUI()

  // preload secondary imagery for drawer/transition continuity
  ;[sideImg, garageImg].forEach(src => { const img = new Image(); img.src = src })
}

init()
