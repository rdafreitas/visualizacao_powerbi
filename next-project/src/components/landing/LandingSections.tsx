// ─────────────────────────────────────────────────────────────
// src/components/landing/LandingSections.tsx
// Seções de conteúdo da landing page:
// Eventos · Workshops · Modalidades · Profissionais · Sobre
// ─────────────────────────────────────────────────────────────

const DIVIDER = (
  <div style={{ margin: '0 60px', height: 1, background: 'linear-gradient(90deg,transparent,rgba(244,231,206,0.10),transparent)' }} />
)

// ── EVENTOS ──────────────────────────────────────────────────
function SecEventos() {
  const eventos = [
    { tag: '🎭 Destaque do Ano', tagColor: '#f27406', titulo: 'Apresentação de Final de Ano', desc: 'Nosso grande espetáculo anual reúne todas as turmas em um teatro com plateia, figurinos, iluminação profissional e direção artística. Uma noite inesquecível para alunos, familiares e convidados.', meta: ['📅 Dezembro 2026', '🏛️ Teatro Municipal', '🎟️ Entrada gratuita'], main: true },
    { tag: '🌸 1° Semestre', tagColor: '#BFD6A1', titulo: 'Mostra Interna — Junho', desc: 'Apresentações das turmas no próprio espaço. Cada aluno mostra o que desenvolveu no semestre para colegas e familiares em um ambiente acolhedor.', meta: ['📅 Junho 2026', '📍 Estúdio Andorin'], main: false },
    { tag: '🍂 2° Semestre', tagColor: '#f27406', titulo: 'Mostra Interna — Novembro', desc: 'Segunda edição da mostra semestral, com a presença de convidados externos e uma curadoria mais elaborada, preparando para o espetáculo final.', meta: ['📅 Novembro 2026', '📍 Estúdio Andorin'], main: false },
    { tag: '🌳 Ao Ar Livre', tagColor: '#BAD0D9', titulo: 'Circo no Parque', desc: 'Apresentações abertas ao público em parques e praças da cidade. Levar o circo além da academia e conectar nossa arte com a comunidade.', meta: ['📅 Datas variadas', '🌳 Parques e praças', '🎟️ Aberto ao público'], main: false },
  ]

  return (
    <section id="sec-eventos" style={{ padding: '80px 60px', position: 'relative', zIndex: 5 }}>
      <p style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:600, letterSpacing:'5px', textTransform:'uppercase', color:'#f27406', marginBottom:14, textAlign:'center' }}>Calendário</p>
      <h2 style={{ fontFamily:'var(--font-shadows)', fontSize:'clamp(32px,4vw,52px)', color:'#F4E7CE', textAlign:'center', marginBottom:48, letterSpacing:1 }}>Eventos do Espaço</h2>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:1000, margin:'0 auto' }}>
        {eventos.map((ev) => (
          <div key={ev.titulo}
            style={{
              gridColumn: ev.main ? '1/-1' : undefined,
              border: '1px solid rgba(244,231,206,0.08)',
              background: ev.main
                ? 'linear-gradient(135deg,rgba(122,29,44,0.15),rgba(242,116,6,0.06))'
                : 'rgba(255,255,255,0.03)',
              borderRadius: 22,
              padding: '30px 28px',
              transition: 'all .3s cubic-bezier(.23,1,.32,1)',
            }}
          >
            <p style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color: ev.tagColor, marginBottom:12 }}>{ev.tag}</p>
            <h3 style={{ fontFamily:'var(--font-shadows)', fontSize: ev.main ? 30 : 22, color:'#F4E7CE', margin:'0 0 10px', letterSpacing:0.5 }}>{ev.titulo}</h3>
            <p style={{ fontFamily:'var(--font-montserrat)', fontSize:13, color:'rgba(244,231,206,0.55)', lineHeight:1.7, marginBottom:16 }}>{ev.desc}</p>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontFamily:'var(--font-montserrat)', fontSize:11, fontWeight:600, color:'rgba(244,231,206,0.40)' }}>
              {ev.meta.map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── WORKSHOPS ─────────────────────────────────────────────────
function SecWorkshops() {
  const wks = [
    { emoji:'🎀', titulo:'Workshop de Tecido Aéreo', data:'Janeiro 2026 · 2 dias · 8h', desc:'Intensivo para iniciantes e intermediários com foco em subidas, amarrações básicas e queda segura. Ministrado por Camila Rocha com convidada especial.', tags:['Iniciante','Intermediário','Aéreo'], featured:false },
    { emoji:'💫', titulo:'Workshop de Lira Circense', data:'Abril 2026 · 1 dia · 6h', desc:'Fundamentos do aparelho, poses estáticas, dinâmicas e sequências. Ministrado por Lara Vaz com artistas convidados do Rio de Janeiro.', tags:['Todos os níveis','Aéreo','Convidados'], featured:true },
    { emoji:'🧘', titulo:'Flex Intensivo — Mobilidade Circense', data:'Junho 2026 · 1 dia · 5h', desc:'Imersão em flexibilidade, mobilidade articular e consciência corporal aplicadas ao circo. Recomendado para alunos de todos os aparelhos.', tags:['Todos os níveis','Flexibilidade','Solo'], featured:false },
  ]

  return (
    <section id="sec-workshops" style={{ padding:'80px 60px 90px', position:'relative', zIndex:5 }}>
      <p style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:600, letterSpacing:'5px', textTransform:'uppercase', color:'#f27406', marginBottom:14, textAlign:'center' }}>Imersões</p>
      <h2 style={{ fontFamily:'var(--font-shadows)', fontSize:'clamp(32px,4vw,52px)', color:'#F4E7CE', textAlign:'center', marginBottom:12, letterSpacing:1 }}>Próximos Workshops</h2>
      <p style={{ fontFamily:'var(--font-montserrat)', fontSize:13, color:'rgba(244,231,206,0.40)', textAlign:'center', marginBottom:48 }}>Sem workshops programados no momento — confira as últimas edições realizadas.</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, maxWidth:1000, margin:'0 auto' }}>
        {wks.map((w) => (
          <div key={w.titulo} style={{ border:`1px solid ${w.featured ? 'rgba(242,116,6,0.2)' : 'rgba(244,231,206,0.08)'}`, background: w.featured ? 'rgba(242,116,6,0.04)' : 'rgba(255,255,255,0.03)', borderRadius:20, padding:'28px 24px', transition:'all .3s cubic-bezier(.23,1,.32,1)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <span style={{ fontSize:32 }}>{w.emoji}</span>
              <span style={{ fontFamily:'var(--font-montserrat)', fontSize:9, fontWeight:700, padding:'4px 10px', borderRadius:20, letterSpacing:1, textTransform:'uppercase', background:'rgba(244,231,206,0.10)', color:'rgba(244,231,206,0.55)' }}>Realizado</span>
            </div>
            <h3 style={{ fontFamily:'var(--font-shadows)', fontSize:20, color:'#F4E7CE', margin:'0 0 6px' }}>{w.titulo}</h3>
            <p style={{ fontFamily:'var(--font-montserrat)', fontSize:11, color:'#f27406', fontWeight:600, marginBottom:12 }}>{w.data}</p>
            <p style={{ fontFamily:'var(--font-montserrat)', fontSize:12, color:'rgba(244,231,206,0.50)', lineHeight:1.7, marginBottom:16 }}>{w.desc}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {w.tags.map(t => <span key={t} style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:600, padding:'4px 10px', borderRadius:20, border:'1px solid rgba(244,231,206,0.12)', color:'rgba(244,231,206,0.50)' }}>{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── MODALIDADES ───────────────────────────────────────────────
function SecModalidades() {
  const mods = [
    { emoji:'💫', nome:'Lira Circense', tagline:'Força, equilíbrio e beleza no aro metálico', body:'A lira é um aparelho aéreo em forma de aro, suspenso por cabos. Praticantes desenvolvem força de braços e core, flexibilidade, equilíbrio e expressão artística — criando sequências de poses estáticas e dinâmicas.', bullets:['Força de membros superiores','Equilíbrio e propriocepção','Expressão artística','Apto para iniciantes'], featured:false },
    { emoji:'🎀', nome:'Tecido Aéreo', tagline:'Subidas, quedas e figuras no ar', body:'Dois painéis de tecido suspensos permitem subidas, amarrações e quedas espetaculares. Desenvolve força, flexibilidade e confiança — além de ser visualmente impactante em shows e fotos.', bullets:['Subidas e amarrações','Quedas controladas','Core e membros superiores','Iniciante ao avançado'], featured:true },
    { emoji:'🧘', nome:'Flex', tagline:'Mobilidade e flexibilidade para o circo', body:'Treino específico de flexibilidade e mobilidade articular voltado para praticantes de circo. Trabalha coluna, quadril, ombros e pernas — aumentando amplitude de movimento e prevenindo lesões.', bullets:['Mobilidade articular','Prevenção de lesões','Coluna e quadril','Complementar a todos'], featured:false },
    { emoji:'💪', nome:'Personal Circo', tagline:'Treino funcional com aparelhos circenses', body:'Treino físico individualizado — como academia ou calistenia — utilizando aparelhos do circo. Desenvolve força, resistência e controle corporal. Ideal para condicionamento diferenciado.', bullets:['Treino individualizado','Força e resistência','Aparelhos circenses','Sem necessidade de show'], featured:false },
  ]

  return (
    <section id="sec-modalidades" style={{ padding:'80px 60px 90px', position:'relative', zIndex:5 }}>
      <p style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:600, letterSpacing:'5px', textTransform:'uppercase', color:'#f27406', marginBottom:14, textAlign:'center' }}>O que ensinamos</p>
      <h2 style={{ fontFamily:'var(--font-shadows)', fontSize:'clamp(32px,4vw,52px)', color:'#F4E7CE', textAlign:'center', marginBottom:52, letterSpacing:1 }}>Nossas Modalidades</h2>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, maxWidth:1100, margin:'0 auto' }}>
        {mods.map((m) => (
          <div key={m.nome} style={{ border:`1px solid ${m.featured ? 'rgba(122,29,44,0.25)' : 'rgba(244,231,206,0.08)'}`, background: m.featured ? 'linear-gradient(160deg,rgba(122,29,44,0.10),rgba(242,116,6,0.05))' : 'rgba(255,255,255,0.03)', borderRadius:20, padding:'30px 22px', display:'flex', flexDirection:'column', gap:14, transition:'all .35s cubic-bezier(.23,1,.32,1)' }}>
            <div style={{ textAlign:'center' }}>
              <span style={{ fontSize:38, display:'block', marginBottom:12 }}>{m.emoji}</span>
              <h3 style={{ fontFamily:'var(--font-shadows)', fontSize:22, color:'#F4E7CE', marginBottom:4 }}>{m.nome}</h3>
              <p style={{ fontFamily:'var(--font-montserrat)', fontSize:11, color:'#f27406', fontWeight:600 }}>{m.tagline}</p>
            </div>
            <p style={{ fontFamily:'var(--font-montserrat)', fontSize:12, color:'rgba(244,231,206,0.50)', lineHeight:1.7, flex:1 }}>{m.body}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:'var(--font-montserrat)', fontSize:11, color:'rgba(244,231,206,0.45)', borderTop:'1px solid rgba(244,231,206,0.06)', paddingTop:12 }}>
              {m.bullets.map(b => <span key={b}>🔸 {b}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── PROFISSIONAIS ─────────────────────────────────────────────
function SecProfissionais() {
  const team = [
    { initials:'AB', gradient:'linear-gradient(135deg,#f27406,#d96604)', nome:'Ana Beatriz', role:'👑 Diretora Artística', modais:['🎀 Tecido','💫 Lira'], bio:'Formada em Artes Cênicas pela UNICAMP e especialização em circo contemporâneo em São Paulo e Montreal. Mais de 15 anos de experiência em artes circenses aéreas, já se apresentou em festivais nacionais e internacionais. Fundou o Estúdio Andorin em 2018.' },
    { initials:'DM', gradient:'linear-gradient(135deg,#BAD0D9,#7a9eab)', nome:'Diego Mendes', role:'🎭 Professor', modais:['🤸 Acrobacia','💪 Personal Circo'], bio:'Educador físico com especialização em treinamento funcional e circense. Atleta de ginástica olímpica por 10 anos, integra preparação física esportiva com pedagogia do circo. Desenvolveu o método Personal Circo do Andorin.' },
    { initials:'CR', gradient:'linear-gradient(135deg,#BFD6A1,#7aad52)', nome:'Camila Rocha', role:'🎭 Professora', modais:['🎀 Tecido','🧘 Flex'], bio:'Bailarina clássica reconvertida ao circo após descobrir o tecido aéreo. Formada pelo Centro de Estudos do Circo de São Paulo, combina técnica da dança com potência do aparelho aéreo. Especialista em Flex circense.' },
    { initials:'LV', gradient:'linear-gradient(135deg,#7A1D2C,#a02438)', nome:'Lara Vaz', role:'🎭 Professora', modais:['💫 Lira Circense'], bio:'Artista circense formada no Brasil e com residência artística na Espanha. Especialista em lira circense, já se apresentou em mais de 8 países. Ministra workshops em todo o Brasil.' },
  ]

  return (
    <section id="sec-profissionais" style={{ padding:'80px 60px 90px', position:'relative', zIndex:5 }}>
      <p style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:600, letterSpacing:'5px', textTransform:'uppercase', color:'#f27406', marginBottom:14, textAlign:'center' }}>Nossa equipe</p>
      <h2 style={{ fontFamily:'var(--font-shadows)', fontSize:'clamp(32px,4vw,52px)', color:'#F4E7CE', textAlign:'center', marginBottom:52, letterSpacing:1 }}>Profissionais</h2>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, maxWidth:1100, margin:'0 auto' }}>
        {team.map((t) => (
          <div key={t.nome} style={{ border:'1px solid rgba(244,231,206,0.08)', background:'rgba(255,255,255,0.03)', borderRadius:20, padding:'28px 22px', textAlign:'center', transition:'all .3s cubic-bezier(.23,1,.32,1)' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-montserrat)', fontSize:20, fontWeight:800, color:'white', margin:'0 auto 16px', background:t.gradient, boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>{t.initials}</div>
            <h3 style={{ fontFamily:'var(--font-shadows)', fontSize:22, color:'#F4E7CE', margin:'0 0 4px' }}>{t.nome}</h3>
            <p style={{ fontFamily:'var(--font-montserrat)', fontSize:11, fontWeight:600, color:'#f27406', marginBottom:10 }}>{t.role}</p>
            <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {t.modais.map(m => <span key={m} style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:600, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(244,231,206,0.12)', color:'rgba(244,231,206,0.55)' }}>{m}</span>)}
            </div>
            <p style={{ fontFamily:'var(--font-montserrat)', fontSize:11.5, color:'rgba(244,231,206,0.45)', lineHeight:1.7, textAlign:'left' }}>{t.bio}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── SOBRE ─────────────────────────────────────────────────────
function SecSobre() {
  const valores = [
    { icon:'🎪', title:'Arte e Expressão', desc:'O circo como linguagem artística legítima e transformadora' },
    { icon:'🛡️', title:'Segurança', desc:'Técnica rigorosa e equipamentos certificados em cada aula' },
    { icon:'🤝', title:'Comunidade', desc:'Um espaço de pertencimento, troca e crescimento coletivo' },
    { icon:'🌱', title:'Evolução Contínua', desc:'Cada aluno no seu ritmo, com metas claras e celebração das conquistas' },
  ]

  return (
    <section id="sec-sobre" style={{ padding:'80px 60px 90px', position:'relative', zIndex:5 }}>
      <p style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:600, letterSpacing:'5px', textTransform:'uppercase', color:'#f27406', marginBottom:14, textAlign:'center' }}>Quem somos</p>
      <h2 style={{ fontFamily:'var(--font-shadows)', fontSize:'clamp(32px,4vw,52px)', color:'#F4E7CE', textAlign:'center', marginBottom:52, letterSpacing:1 }}>Sobre o Estúdio Andorin</h2>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:40, maxWidth:1000, margin:'0 auto' }}>
        <div>
          <p style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#f27406', marginBottom:16 }}>Missão</p>
          <p style={{ fontFamily:'var(--font-montserrat)', fontSize:15, color:'rgba(244,231,206,0.65)', lineHeight:1.9 }}>Democratizar o acesso às artes circenses, oferecendo um espaço seguro, acolhedor e profissional onde pessoas de todas as idades e níveis possam descobrir e desenvolver sua expressão artística através do circo.</p>
        </div>
        <div>
          <p style={{ fontFamily:'var(--font-montserrat)', fontSize:10, fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#f27406', marginBottom:16 }}>Valores</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {valores.map((v) => (
              <div key={v.title} style={{ border:'1px solid rgba(244,231,206,0.08)', borderRadius:16, padding:'20px 18px', background:'rgba(255,255,255,0.03)', transition:'all .3s' }}>
                <span style={{ fontSize:24, display:'block', marginBottom:10 }}>{v.icon}</span>
                <p style={{ fontFamily:'var(--font-montserrat)', fontSize:13, fontWeight:700, color:'#F4E7CE', marginBottom:6 }}>{v.title}</p>
                <p style={{ fontFamily:'var(--font-montserrat)', fontSize:11, color:'rgba(244,231,206,0.45)', lineHeight:1.5 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Exportação composta ───────────────────────────────────────
export function LandingSections() {
  const DIV = <div style={{ margin:'0 60px', height:1, background:'linear-gradient(90deg,transparent,rgba(244,231,206,0.10),transparent)' }} />
  return (
    <>
      {DIV}
      <SecEventos/>
      {DIV}
      <SecWorkshops/>
      {DIV}
      <SecModalidades/>
      {DIV}
      <SecProfissionais/>
      {DIV}
      <SecSobre/>
    </>
  )
}
