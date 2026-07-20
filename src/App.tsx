import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import logoUrl from './assets/cardiocore-logo.png'
import xrayUrl from './assets/reference-xray.png'
import referenceHeartUrl from './assets/reference-heart.png'
import conceptDrawingUrl from './assets/concept-drawing.png'
import modelUrl from './assets/cardiocore-heart.glb?url'
import './App.css'

const MONOBANK_LINK = 'https://send.monobank.ua/jar/4YgBs54sz'

const stats = [
  ['Тип пристрою', 'Імплантоване штучне серце'],
  ['Принцип роботи', 'Електромеханічний насос'],
  ['Живлення', 'Акумуляторна система'],
  ['Автономність', 'до 8–12 годин'],
  ['Робоча температура', '35–40 °C'],
  ['Термін служби', 'понад 10 років'],
  ['Довжина', '110 мм'],
  ['Ширина', '95 мм'],
  ['Висота', '75 мм'],
  ['Маса', '700–900 г'],
]

const features = [
  ['◉', 'Моніторинг тиску', 'Контроль тиску в системі кровообігу в реальному часі'],
  ['⌁', 'Пульсова активність', 'Відстеження частоти перекачування та ритму роботи'],
  ['◌', 'Температурний контроль', 'Захист системи від перегріву та критичних режимів'],
  ['⌁', 'Потік крові', 'Автоматичне регулювання кровотоку відповідно до навантаження'],
  ['↗', 'Дистанційний моніторинг', 'Підготовка даних для інтеграції з цифровими системами'],
  ['◈', 'Стан пристрою', 'Безперервний контроль ключових параметрів системи'],
  ['24', 'Робота 24/7', 'Розрахована на безперервну роботу протягом доби'],
  ['⚙', 'Модульна архітектура', 'Конструкція, що спрощує розвиток і тестування прототипу'],
]

const costs = [
  ['Титановий корпус', '$3 000'],
  ['Насосний модуль', '$12 000'],
  ['Електронний блок керування', '$8 000'],
  ['Акумуляторна система', '$5 000'],
  ['Сенсори та датчики', '$4 000'],
  ['Клапанна система', '$10 000'],
  ['Збірка та тестування', '$18 000'],
]

function PulseLine() {
  return (
    <svg className="pulse-line" viewBox="0 0 1200 180" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 90 H160 L195 90 L225 82 L250 90 H350 L385 90 L415 82 L440 90 H520 L550 90 L575 20 L605 160 L635 90 H715 L750 90 L780 82 L805 90 H900 L930 90 L955 82 L980 90 H1200" />
    </svg>
  )
}

function ModelViewer({ exploded }: { exploded: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const explodedRef = useRef(exploded)
  useEffect(() => {
    explodedRef.current = exploded
  }, [exploded])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.15
    controls.maxDistance = 100
    controls.rotateSpeed = 0.8

    scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x071321, 2.4))

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)

    const blueLight = new THREE.PointLight(0x008cff, 4, 20)
    blueLight.position.set(-4, 1, 4)
    scene.add(blueLight)

    const rimLight = new THREE.PointLight(0x24c6ff, 3, 20)
    rimLight.position.set(4, -2, -5)
    scene.add(rimLight)

    const modelRoot = new THREE.Group()
    scene.add(modelRoot)

    type ModelPart = {
      object: THREE.Mesh
      originLocal: THREE.Vector3
      originWorld: THREE.Vector3
      direction: THREE.Vector3
      distance: number
    }

    const parts: ModelPart[] = []
    const loader = new GLTFLoader()
    let animationFrame = 0
    let lastTime = performance.now()
    let disposed = false

    const frameModel = (model: THREE.Object3D) => {
      const bounds = new THREE.Box3().setFromObject(model)
      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      const maxSize = Math.max(size.x, size.y, size.z)

      model.position.sub(center)
      modelRoot.scale.setScalar(2.1 / maxSize)

      const fittedBounds = new THREE.Box3().setFromObject(modelRoot)
      const fittedCenter = fittedBounds.getCenter(new THREE.Vector3())
      const fittedSize = fittedBounds.getSize(new THREE.Vector3())
      const fittedMax = Math.max(fittedSize.x, fittedSize.y, fittedSize.z)

      const distance = fittedMax / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45
      camera.position.set(0, fittedMax * 0.05, distance)
      camera.near = Math.max(fittedMax / 1000, 0.001)
      camera.far = Math.max(fittedMax * 100, 100)
      camera.updateProjectionMatrix()
      controls.target.copy(fittedCenter)
      controls.update()
    }

    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return
        const model = gltf.scene

        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true
            object.receiveShadow = true
          }
        })

        modelRoot.add(model)
        frameModel(model)

        const modelBounds = new THREE.Box3().setFromObject(modelRoot)
        const modelCenter = modelBounds.getCenter(new THREE.Vector3())

        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return

          const originWorld = object.getWorldPosition(new THREE.Vector3())
          const direction = originWorld.clone().sub(modelCenter)

          if (direction.lengthSq() < 0.000001) {
            direction.set(
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
            )
          }

          direction.normalize()
          parts.push({
            object,
            originLocal: object.position.clone(),
            originWorld,
            direction,
            distance: 0.35 + Math.random() * 0.55,
          })
        })
      },
      undefined,
      (error) => {
        console.error('CardioCore 3D model loading error:', error)
      },
    )

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const animate = (time: number) => {
      if (disposed) return

      const delta = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time

      parts.forEach((part) => {
        if (!part.object.parent) return

        const targetWorld = explodedRef.current
          ? part.originWorld.clone().add(part.direction.clone().multiplyScalar(part.distance))
          : part.originWorld.clone()

        const targetLocal = part.object.parent.worldToLocal(targetWorld)
        const target = explodedRef.current ? targetLocal : part.originLocal

        part.object.position.lerp(target, Math.min(delta * 7, 1))
      })

      controls.update()
      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(animate)
    }

    const zoom = (amount: number) => {
      const direction = camera.position.clone().sub(controls.target).normalize()
      const distance = camera.position.distanceTo(controls.target)
      const nextDistance = THREE.MathUtils.clamp(distance * amount, controls.minDistance, controls.maxDistance)
      camera.position.copy(controls.target).add(direction.multiplyScalar(nextDistance))
    }

    const zoomIn = () => zoom(0.78)
    const zoomOut = () => zoom(1.28)
    const resetView = () => {
      const target = controls.target.clone()
      const distance = Math.max(1.2, camera.position.distanceTo(target))
      camera.position.set(0, distance * 0.05, distance)
      controls.target.copy(target)
      controls.update()
    }

    container.addEventListener('cardiocore:zoom-in', zoomIn)
    container.addEventListener('cardiocore:zoom-out', zoomOut)
    container.addEventListener('cardiocore:reset', resetView)

    animationFrame = requestAnimationFrame(animate)

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      modelRoot.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
          else object.material.dispose()
        }
      })
      container.removeEventListener('cardiocore:zoom-in', zoomIn)
      container.removeEventListener('cardiocore:zoom-out', zoomOut)
      renderer.domElement.remove()
    }
  }, [])

  const dispatch = (name: string) => {
    containerRef.current?.dispatchEvent(new Event(`cardiocore:${name}`))
  }

  return (
    <div className="three-container-wrap">
      <div ref={containerRef} className="three-container" />
      <div className="model-controls" aria-label="Керування 3D-моделлю">
        <button onClick={() => dispatch('zoom-in')} aria-label="Збільшити модель">+</button>
        <button onClick={() => dispatch('zoom-out')} aria-label="Зменшити модель">−</button>
        <button onClick={() => dispatch('reset')} aria-label="Скинути вигляд">⌂</button>
      </div>
      <div className="model-help">
        <span>DRAG — ROTATE</span>
        <span>SCROLL — ZOOM</span>
      </div>
    </div>
  )
}

function App() {
  const [exploded, setExploded] = useState(false)
  const [showDonation, setShowDonation] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveFeature((current) => (current + 1) % features.length)
    }, 3600)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <main>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <a href="#top" className="brand">
          <img src={logoUrl} alt="CardioCore" />
          <span>CardioCore</span>
        </a>
        <nav>
          <a href="#mission">01 / Місія</a>
          <a href="#problem">02 / Виклик</a>
          <a href="#concept">03 / Концепт</a>
          <a href="#model">04 / Модель</a>
        </nav>
      </header>

      <section id="top" className="hero-section">
        <PulseLine />
        <div className="hero-content">
          <img className="hero-logo" src={logoUrl} alt="Логотип CardioCore" />
          <p className="eyebrow">MEDTECH / HEART SYSTEMS / 01</p>
          <h1>CardioCore</h1>
          <p className="hero-subtitle">Інженерія, що тримає ритм життя.</p>
        </div>
        <a className="scroll-cue" href="#mission">
          <span>ГОРТАТИ</span>
          <span className="arrow">↓</span>
        </a>
      </section>

      <section id="mission" className="section mission-section">
        <div className="section-index">01 / MISSION</div>
        <div className="mission-content">
          <p className="eyebrow">КОНЦЕПЦІЯ</p>
          <h2>Серце майбутнього<br /><span>працює в реальному часі.</span></h2>
          <p className="lead">CardioCore — це інноваційне штучне серце, створене для порятунку життя людей із серцево-судинними захворюваннями.</p>
          <p>Наша мета — поєднати сучасні технології, інженерію та медицину, щоб забезпечити надійний моніторинг і підтримку роботи серця в режимі реального часу.</p>
          <div className="mission-interaction">
            <div className="signal-orb"><span /></div>
            <div>
              <strong>Система активна</strong>
              <small>моніторинг доступний 24 / 7</small>
            </div>
          </div>
        </div>
        <div className="mission-metric">
          <span>24/7</span>
          <small>безперервний<br />контроль</small>
        </div>
      </section>

      <section id="problem" className="section problem-section">
        <div className="section-index">02 / CHALLENGE</div>
        <div className="split-layout">
          <div className="problem-copy">
            <p className="eyebrow">ВИКЛИК</p>
            <h2>Система, яка<br /><span>не має права зупинитися.</span></h2>
            <p>Серцево-судинні захворювання залишаються однією з головних причин смертності у світі. Хоча сьогодні вже існують штучні серця та механічні системи підтримки кровообігу, більшість із них мають низку обмежень: великі габарити, високе енергоспоживання, обмежений функціонал моніторингу та складність інтеграції із сучасними цифровими технологіями.</p>
            <p>CardioCore пропонує новий підхід — прототип інтелектуального штучного серця, який поєднує компактну конструкцію, систему безперервного моніторингу життєвих показників, можливість аналізу даних у реальному часі та модульну архітектуру.</p>
            <div className="problem-tag">COMPACT / INTELLIGENT / MODULAR</div>
          </div>
          <div className="image-frame">
            <img src={xrayUrl} alt="Медична рентгенографія з імплантованою системою" />
            <span className="image-label">RESEARCH / 02</span>
          </div>
        </div>
      </section>

      <section id="concept" className="section concept-section">
        <div className="section-index">03 / ORIGIN</div>
        <div className="concept-heading">
          <p className="eyebrow">ВІД ДОСЛІДЖЕННЯ ДО КОНЦЕПТУ</p>
          <h2>Інженерна ідея<br /><span>набуває форми.</span></h2>
        </div>
        <div className="concept-grid">
          <div className="reference-card"><img src={referenceHeartUrl} alt="Приклад механічної системи" /><span>REFERENCE / SYSTEM</span></div>
          <div className="reference-card"><img src={conceptDrawingUrl} alt="CAD-креслення концепту CardioCore" /><span>CONCEPT / CAD</span></div>
          <div className="concept-copy">
            <p>Кожна інновація починається з глибокого аналізу існуючих технологій. Ми дослідили сучасні моделі штучних сердець, їхню конструкцію та принципи роботи, після чого розробили власну концептуальну CAD-модель.</p>
            <p>Представлене креслення є першим етапом інженерного проєктування, що стане основою для подальшого створення прототипу та тестування конструкції.</p>
            <div className="concept-line"><span>01</span><i /><span>CAD / PROTOTYPE</span></div>
          </div>
        </div>
      </section>

      <section id="model" className="section model-section">
        <div className="section-index">04 / CORE SYSTEM</div>
        <div className="model-header">
          <div>
            <p className="eyebrow">INTERACTIVE PROTOTYPE</p>
            <h2>Розгляньте<br /><span>CardioCore зсередини.</span></h2>
          </div>
          <button className={`explode-button ${exploded ? 'active' : ''}`} onClick={() => setExploded((value) => !value)}>
            <span>{exploded ? 'ЗІБРАТИ СИСТЕМУ' : 'РОЗІБРАТИ СИСТЕМУ'}</span>
            <b>{exploded ? '−' : '+'}</b>
          </button>
        </div>
        <div className="model-layout">
          <div className="model-viewer">
            <ModelViewer exploded={exploded} />
            <div className="model-corner">CARDIOCORE / 3D-01</div>
          </div>
          <aside className="telemetry-panel">
            <div className="panel-top"><span>LIVE TELEMETRY</span><i /></div>
            <div className="pulse-card">
              <div className="pulse-card-head"><span>HEART RATE</span><b>72 <small>BPM</small></b></div>
              <PulseLine />
              <span className="live-dot">● LIVE SIGNAL</span>
            </div>
            <div className="telemetry-grid">
              <div><span>PRESSURE</span><strong>118 <small>mmHg</small></strong><em>OPTIMAL</em></div>
              <div><span>BLOOD FLOW</span><strong>5.2 <small>L/min</small></strong><em>STABLE</em></div>
              <div><span>TEMPERATURE</span><strong>37.1 <small>°C</small></strong><em>NORMAL</em></div>
              <div><span>BATTERY</span><strong>87 <small>%</small></strong><em>8.4 H REMAINING</em></div>
            </div>
            <div className="feature-carousel">
              <div className="feature-carousel-title">SYSTEM MONITORING</div>
              <div className="feature-detail"><span>{features[activeFeature][0]}</span><div><strong>{features[activeFeature][1]}</strong><p>{features[activeFeature][2]}</p></div></div>
              <div className="feature-dots">{features.map((_, index) => <button key={index} className={index === activeFeature ? 'active' : ''} onClick={() => setActiveFeature(index)} aria-label={`Показати характеристику ${index + 1}`} />)}</div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section specs-section">
        <div className="section-index">05 / SPECIFICATION</div>
        <div className="specs-header"><p className="eyebrow">ТЕХНІЧНИЙ ПРОФІЛЬ</p><h2>Створено з точністю<br /><span>до кожного компонента.</span></h2></div>
        <div className="specs-layout">
          <div className="materials">
            <h3>МАТЕРІАЛИ</h3>
            {[
              ['01', 'Корпус', 'Титановий сплав медичного класу / Ti-6Al-4V'],
              ['02', 'Внутрішні компоненти', 'Біосумісні полімери / PEEK, PTFE'],
              ['03', 'Клапанна система', 'Піролітичний вуглець'],
              ['04', 'Ущільнення', 'Медичний силікон'],
              ['05', 'Покриття', 'Гемосумісне антикоагуляційне покриття'],
            ].map(([n, title, value]) => <div className="material-row" key={n}><span>{n}</span><strong>{title}</strong><small>{value}</small></div>)}
          </div>
          <div className="stats-list">
            <h3>ОСНОВНІ ПАРАМЕТРИ</h3>
            {stats.map(([title, value]) => <div className="stat-row" key={title}><span>{title}</span><strong>{value}</strong></div>)}
          </div>
        </div>
        <div className="feature-strip">
          <h3>ФУНКЦІОНАЛЬНІ МОЖЛИВОСТІ</h3>
          {features.map(([icon, title, text]) => <div className="feature-tile" key={title}><span>{icon}</span><strong>{title}</strong><small>{text}</small></div>)}
        </div>
      </section>

      <section className="section cost-section">
        <div className="section-index">06 / ECONOMICS</div>
        <div className="cost-heading"><div><p className="eyebrow">ЕКОНОМІКА ПРОТОТИПУ</p><h2>Ціна технології,<br /><span>що рятує життя.</span></h2></div><div className="total-cost"><span>ESTIMATED COST</span><strong>≈ $60K</strong><small>Собівартість одного виробу</small></div></div>
        <div className="cost-table">{costs.map(([item, price]) => <div className="cost-row" key={item}><span>{item}</span><i /><strong>{price}</strong></div>)}</div>
      </section>

      <section className="invest-section">
        <div className="invest-glow" />
        <div className="section-index">07 / FUTURE</div>
        <div className="invest-content"><p className="eyebrow">ДОЛУЧАЙТЕСЯ</p><h2>Інвестуйте<br /><span>в технологію,<br />що рятує життя.</span></h2><p>Ми створюємо інноваційне рішення у сфері MedTech, яке має потенціал зробити лікування серцевої недостатності доступнішим для тисяч пацієнтів. Запрошуємо інвесторів та стратегічних партнерів долучитися до розвитку проєкту й разом зробити внесок у медицину майбутнього.</p><div className="investment-need"><span>ПОТРЕБА В ІНВЕСТИЦІЯХ</span><strong>$2.7M</strong></div><button className="support-button" onClick={() => setShowDonation(true)}>ПІДТРИМАТИ CARDIOCORE <span>↗</span></button></div>
      </section>

      <footer className="footer">
        <div className="footer-brand"><img src={logoUrl} alt="" /><strong>CardioCore</strong><span>ENGINEERING THE NEXT HEARTBEAT.</span></div>
        <div className="footer-info"><div><span>PROJECT</span><strong>Artificial Heart / MedTech</strong></div><div><span>STATUS</span><strong>Concept / Prototype</strong></div><div><span>CONTACT</span><strong>cardiocore.team@gmail.com</strong></div></div>
        <div className="footer-bottom"><span>© 2026 CARDIOCORE</span><span>DESIGNED FOR THE FUTURE OF MEDICINE</span></div>
      </footer>

      {showDonation && <div className="donation-overlay" onClick={() => setShowDonation(false)}><div className="donation-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowDonation(false)}>×</button><span className="eyebrow">SUPPORT THE CORE</span><h3>Підтримайте<br /><span>медицину майбутнього.</span></h3><p>Кожен внесок допомагає розвивати концепцію CardioCore та наближати її до етапу створення прототипу.</p><div className="donation-amount">$2.7M <small>GOAL</small></div><a className="monobank-button" href={MONOBANK_LINK} target="_blank" rel="noreferrer">ПЕРЕЙТИ ДО БАНКИ MONOBANK <span>↗</span></a><small className="modal-note">Посилання на банку Monobank можна змінити у змінній MONOBANK_LINK у файлі App.tsx.</small></div></div>}
    </main>
  )
}

export default App
