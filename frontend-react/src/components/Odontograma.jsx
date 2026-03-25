import React, { useState, useEffect } from 'react';
import api from '../services/api';

// ── Coordenadas VISÃO LATERAL — mapeadas pelo usuário + rx/ry por tipo anatômico ──
// Molares (mx>my): largos | Pré-molares: médios | Caninos/Incisivos (rx<ry): altos
const DENTES_LATERAL_COORDS = {
  // Fileira superior (18→28) — número acima
  18: { cx:  57, cy: 345, rx: 21, ry: 15 }, // molar 3 raizes, largo
  17: { cx: 113, cy: 343, rx: 20, ry: 16 }, // molar
  16: { cx: 166, cy: 343, rx: 20, ry: 16 }, // molar
  15: { cx: 211, cy: 332, rx: 14, ry: 20 }, // pré-molar
  14: { cx: 244, cy: 332, rx: 13, ry: 20 }, // pré-molar
  13: { cx: 283, cy: 323, rx: 10, ry: 26 }, // canino — fino e longo
  12: { cx: 317, cy: 329, rx:  9, ry: 24 }, // incisivo lateral — fino e longo
  11: { cx: 349, cy: 326, rx: 11, ry: 24 }, // incisivo central — fino e longo
  21: { cx: 390, cy: 325, rx: 11, ry: 24 },
  22: { cx: 424, cy: 332, rx:  9, ry: 24 },
  23: { cx: 459, cy: 323, rx: 10, ry: 26 },
  24: { cx: 497, cy: 330, rx: 13, ry: 20 },
  25: { cx: 530, cy: 329, rx: 14, ry: 20 },
  26: { cx: 574, cy: 342, rx: 20, ry: 16 },
  27: { cx: 631, cy: 341, rx: 20, ry: 16 },
  28: { cx: 684, cy: 344, rx: 21, ry: 15 },
  // Fileira inferior (48→38) — número abaixo
  48: { cx: 690, cy: 426, rx: 21, ry: 15 },
  47: { cx: 632, cy: 429, rx: 20, ry: 16 },
  46: { cx: 579, cy: 431, rx: 20, ry: 16 },
  45: { cx: 530, cy: 439, rx: 14, ry: 20 },
  44: { cx: 493, cy: 438, rx: 13, ry: 20 },
  43: { cx: 451, cy: 446, rx: 10, ry: 26 },
  42: { cx: 413, cy: 432, rx:  9, ry: 24 },
  41: { cx: 384, cy: 428, rx: 11, ry: 24 },
  31: { cx: 359, cy: 430, rx: 11, ry: 24 },
  32: { cx: 329, cy: 435, rx:  9, ry: 24 },
  33: { cx: 290, cy: 445, rx: 10, ry: 26 },
  34: { cx: 249, cy: 439, rx: 13, ry: 20 },
  35: { cx: 211, cy: 441, rx: 14, ry: 20 },
  36: { cx: 163, cy: 426, rx: 20, ry: 16 },
  37: { cx: 109, cy: 426, rx: 20, ry: 16 },
  38: { cx:  50, cy: 425, rx: 21, ry: 15 },
};


// ============================================================
// COORDENADAS DOS DENTES (mapeadas da imagem 740x740)
// ============================================================
const DENTES_COORDS = {
  // ── Arcada Superior — coordenadas flood-fill nativas 740x740 ──
  18: { x: 213, y: 240, r: 30 },
  17: { x: 222, y: 199, r: 30 },
  16: { x: 233, y: 154, r: 30 },
  15: { x: 246, y: 113, r: 24 },
  14: { x: 262, y:  82, r: 22 },
  13: { x: 282, y:  52, r: 19 },
  12: { x: 313, y:  35, r: 16 },
  11: { x: 347, y:  27, r: 16 },
  21: { x: 390, y:  27, r: 16 },
  22: { x: 424, y:  35, r: 16 },
  23: { x: 456, y:  51, r: 19 },
  24: { x: 476, y:  82, r: 22 },
  25: { x: 492, y: 112, r: 24 },
  26: { x: 505, y: 153, r: 30 },
  27: { x: 516, y: 198, r: 30 },
  28: { x: 526, y: 240, r: 30 },
  // ── Arcada Inferior — coordenadas flood-fill nativas 740x740 ──
  48: { x: 213, y: 522, r: 30 },
  47: { x: 227, y: 568, r: 30 },
  46: { x: 245, y: 615, r: 30 },
  45: { x: 261, y: 655, r: 24 },
  44: { x: 277, y: 683, r: 22 },
  43: { x: 301, y: 704, r: 19 },
  42: { x: 330, y: 715, r: 16 },
  41: { x: 357, y: 717, r: 16 },
  31: { x: 385, y: 719, r: 16 },
  32: { x: 413, y: 716, r: 16 },
  33: { x: 441, y: 705, r: 19 },
  34: { x: 465, y: 684, r: 22 },
  35: { x: 480, y: 655, r: 24 },
  36: { x: 496, y: 615, r: 30 },
  37: { x: 513, y: 567, r: 30 },
  38: { x: 527, y: 521, r: 30 },
};

// ============================================================
// CONDIÇÕES CLÍNICAS
// ============================================================
const CONDICOES = [
  { id: 'CARIE', label: 'Cárie', fill: '#FB923C', stroke: '#EA580C' },
  { id: 'RESTAURADO', label: 'Restaurado', fill: '#60A5FA', stroke: '#2563EB' },
  { id: 'EXTRAIDO', label: 'Extraído', fill: '#CBD5E1', stroke: '#64748B' },
  { id: 'PROTESE', label: 'Prótese', fill: '#C084FC', stroke: '#7C3AED' },
  { id: 'ENDODONTIA', label: 'Endodontia', fill: '#F87171', stroke: '#DC2626' },
  { id: 'OBSERVACAO', label: 'Observação', fill: '#FDE047', stroke: '#D97706' },
];

const getCondicao = (id) => CONDICOES.find(c => c.id === id);

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const Odontograma = ({ pacienteId }) => {
  const [estadoMap, setEstadoMap] = useState({});
  const [selectedDente, setSelected] = useState(null);
  const [hoveredDente, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [condicaoSel, setCondicaoSel] = useState(null);
  
  // Array para rastrear IDs dentes que foram limpos pelo usuário e devem ser deletados da base
  const [removidos, setRemovidos] = useState([]);

  // Coordenadas já calibradas para 560px — sem escala extra
  const DISPLAY = 560;

  // ---- LOAD ----
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/odontograma/${pacienteId}`);
        if (res.data) {
          const data = res.data;
          const mapa = {};
          Object.values(data).forEach(d => {
            mapa[String(d.numero_dente)] = { condicao: d.condicao, observacao: d.observacao };
          });
          setEstadoMap(mapa);
          setRemovidos([]);
          setDirty(false);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (pacienteId) load();
  }, [pacienteId]);

  // ---- SELECT DENTE ----
  const handleDenteClick = (num) => {
    const key = String(num);
    if (selectedDente === key) {
      setSelected(null);
      return;
    }
    setSelected(key);
    const estado = estadoMap[key];
    setCondicaoSel(estado?.condicao || null);
    setObservacao(estado?.observacao || '');
  };

  // ---- CONFIRMAR CONDIÇÃO ----
  const handleConfirmar = () => {
    if (!selectedDente || !condicaoSel) return;
    setEstadoMap(prev => ({
      ...prev,
      [selectedDente]: { condicao: condicaoSel, observacao }
    }));
    // Se o dente estava na lista de removidos, tira de lá
    if (removidos.includes(parseInt(selectedDente))) {
      setRemovidos(prev => prev.filter(n => n !== parseInt(selectedDente)));
    }
    setDirty(true);
    setSelected(null);
  };

  // ---- LIMPAR DENTE ----
  const handleLimpar = () => {
    if (!selectedDente) return;
    setEstadoMap(prev => {
      const next = { ...prev };
      delete next[selectedDente];
      return next;
    });
    // Adiciona à lista de removidos para a API apagar
    if (!removidos.includes(parseInt(selectedDente))) {
      setRemovidos(prev => [...prev, parseInt(selectedDente)]);
    }
    setDirty(true);
    setSelected(null);
  };

  // ---- SALVAR ----
  const handleSalvar = async () => {
    try {
      setSaving(true);
      const dentes = Object.entries(estadoMap).map(([num, val]) => ({
        numero_dente: parseInt(num),
        condicao: val.condicao,
        observacao: val.observacao || null,
      }));
      
      const payload = { 
        dentes,
        dentes_removidos: removidos 
      };

      await api.post(`/api/odontograma/${pacienteId}`, payload);
      
      setDirty(false);
      setRemovidos([]); // Reseta após salvar
    } catch { alert('Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const todasAlteracoes = Object.entries(estadoMap)
    .filter(([, v]) => v.condicao)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  if (loading) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 flex items-center gap-3 text-slate-400">
        <div className="animate-spin w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full" />
        Carregando odontograma...
      </section>
    );
  }

  const selectedCondicao = selectedDente ? getCondicao(condicaoSel) : null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl text-xl">🦷</div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Odontograma</h3>
            <p className="text-xs text-slate-500 mt-0.5">Clique em qualquer dente para registrar a condição clínica</p>
          </div>
        </div>
        <button
          onClick={handleSalvar}
          disabled={!dirty || saving}
          className={`text-sm font-bold px-5 py-2 rounded-xl transition-all ${dirty ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
        >
          {saving ? 'Salvando...' : dirty ? '💾 Salvar' : '✓ Salvo'}
        </button>
      </div>

      {/* Layout: imagem + painel */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Usando uma IIFE com try/catch para renderizar o JSX */}
        {(() => {
          try {
            return (
              <>
                {/* Imagem com hotspots SVG - Container Responsivo */}
        <div className="w-full xl:w-1/2 max-w-[650px] mx-auto shrink-0 relative">
            {/* Imagem base */}
            <img
              src="/odontograma.avif"
              alt="Odontograma"
              style={{ width: '100%', display: 'block', userSelect: 'none' }}
              draggable={false}
            />

            {/* SVG overlay — viewBox expandido com margem de 60px para acomodar a numeração */}
            <svg
              style={{ position: 'absolute', top: '-8%', left: '-8%', width: '116%', height: '116%' }}
              viewBox="-60 -60 860 860"
              preserveAspectRatio="xMidYMid meet"
            >
              {Object.entries(DENTES_COORDS).map(([num, { x, y, r }]) => {
                const key = String(num);
                const estado = estadoMap[key];
                const cond = estado?.condicao ? getCondicao(estado.condicao) : null;
                const isSelected = selectedDente === key;
                const isHovered = hoveredDente === key;
                // Coordenadas já calibradas para espaço 560x560
                // Cálculo polar para empurrar o número para "fora" da curvatura
                // Coordenadas já calibradas para espaço 560x560
                const cx = x, cy = y, cr = r;
                // Cálculo polar para empurrar o número para "fora" da curvatura
                const isArcadaSuperior = parseInt(num) < 30;
                // Os centros aproximados da circunferência das duas "ferraduras"
                const polarCenterY = isArcadaSuperior ? 250 : 490;
                const dx = cx - 370;
                const dy = cy - polarCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                // Distância extra que o texto deve ficar a partir do centro do dente
                const textOffset = cr + 14; 
                // Coordenadas calculadas
                const textX = cx + (dx / distance) * textOffset;
                const textY = cy + (dy / distance) * textOffset + 4; // +4 para alinhar baseline da fonte

                return (
                  <g
                    key={num}
                    onClick={() => handleDenteClick(parseInt(num))}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Área invisível maior para facilitar o clique */}
                    <circle cx={cx} cy={cy} r={cr + 4} fill="transparent" />

                    {/* Círculo colorido (condição) ou hover sutil */}
                    <circle
                      cx={cx} cy={cy} r={cr}
                      fill={cond ? cond.fill + 'CC' : (isHovered ? '#6366F115' : 'transparent')}
                      stroke={
                        isSelected ? '#6366F1' :
                          cond ? cond.stroke :
                            isHovered ? '#6366F155' : 'none'
                      }
                      strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 1}
                      strokeDasharray={(!cond && isHovered) ? '3,2' : 'none'}
                    />

                    {/* Glow de seleção */}
                    {isSelected && (
                      <circle cx={cx} cy={cy} r={cr + 5} fill="none" stroke="#6366F1" strokeWidth="1.5" opacity="0.35" />
                    )}

                    {/* Número do dente perfeitamente acompanhando o formato da ferradura */}
                    <text
                      x={textX} y={textY}
                      textAnchor="middle" fontSize="12" fontWeight="800"
                      fill={isSelected ? '#6366F1' : cond ? cond.stroke : '#374151'}
                      stroke="white" strokeWidth="4" paintOrder="stroke"
                      style={{ pointerEvents: 'none', fontFamily: 'system-ui, sans-serif' }}
                    >{num}</text>

                    {/* Badge da condição */}
                    {cond && (
                      <text
                        x={cx} y={cy + 3.5}
                        textAnchor="middle" fontSize="7" fontWeight="900"
                        fill={cond.stroke}
                        style={{ pointerEvents: 'none', fontFamily: 'monospace' }}
                      >{cond.label.substring(0, 3).toUpperCase()}</text>
                    )}
                  </g>
                );
              })}

              {/* ── Visão Lateral (fileiras do meio da imagem) ── */}
              {Object.entries(DENTES_LATERAL_COORDS).map(([num, { cx, cy, rx, ry }]) => {
                const key = String(num);
                const estado = estadoMap[key];
                const cond     = estado?.condicao ? getCondicao(estado.condicao) : null;
                const isSelected = selectedDente === key;
                const isHovered  = hoveredDente === key;
                // Números acima para arcada superior (11→28), abaixo para inferior (31→48)
                const isLower = parseInt(num) >= 30;
                const textY = isLower ? cy + ry + 14 : cy - ry - 9;
                return (
                  <g
                    key={`lat-${num}`}
                    onClick={() => handleDenteClick(parseInt(num))}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hit area maior */}
                    <ellipse cx={cx} cy={cy} rx={rx + 5} ry={ry + 5} fill="transparent" />
                    {/* Ellipse do dente */}
                    <ellipse
                      cx={cx} cy={cy} rx={rx} ry={ry}
                      fill={cond ? cond.fill + 'BB' : (isHovered ? '#6366F120' : 'transparent')}
                      stroke={isSelected ? '#6366F1' : cond ? cond.stroke : isHovered ? '#6366F177' : 'none'}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 1}
                      strokeDasharray={(!cond && isHovered) ? '3,2' : 'none'}
                    />
                    {isSelected && (
                      <ellipse cx={cx} cy={cy} rx={rx + 5} ry={ry + 5} fill="none" stroke="#6366F1" strokeWidth="1.5" opacity="0.35" />
                    )}
                    {/* Número do dente com outline branco para legibilidade */}
                    <text
                      x={cx} y={textY}
                      textAnchor="middle" fontSize="12" fontWeight="800"
                      fill={isSelected ? '#6366F1' : cond ? cond.stroke : '#374151'}
                      stroke="white" strokeWidth="4" paintOrder="stroke"
                      style={{ pointerEvents: 'none', fontFamily: 'system-ui, sans-serif' }}
                    >{num}</text>
                    {/* Badge condição dentro da ellipse */}
                    {cond && (
                      <text
                        x={cx} y={cy + 3}
                        textAnchor="middle" fontSize="6" fontWeight="900"
                        fill={cond.stroke}
                        stroke="white" strokeWidth="2" paintOrder="stroke"
                        style={{ pointerEvents: 'none', fontFamily: 'system-ui' }}
                      >{cond.label.substring(0, 3).toUpperCase()}</text>
                    )}
                  </g>
                );
              })}
            </svg>
        </div>

        {/* Painel lateral */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Painel de seleção de condição */}
          {selectedDente ? (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 animate-in fade-in duration-150">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                🦷 Dente <span className="text-indigo-600">{selectedDente}</span>
                {condicaoSel && <span className="text-xs font-normal text-slate-500 ml-1">— {getCondicao(condicaoSel)?.label}</span>}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {CONDICOES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCondicaoSel(c.id)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all text-left ${condicaoSel === c.id ? 'ring-2 ring-indigo-500 ring-offset-1 scale-[1.02]' : 'opacity-75 hover:opacity-100'}`}
                    style={{ background: c.fill + '44', borderColor: c.stroke, color: c.stroke }}
                  >
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: c.fill, border: `1px solid ${c.stroke}` }} />
                    {c.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Observação (opcional)..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 mb-3 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />

              <div className="flex gap-2">
                <button onClick={() => setSelected(null)} className="flex-1 text-xs text-slate-500 border border-slate-200 dark:border-slate-600 rounded-xl py-2 hover:bg-slate-100 transition">
                  Cancelar
                </button>
                {estadoMap[selectedDente]?.condicao && (
                  <button onClick={handleLimpar} className="text-xs text-red-500 border border-red-200 rounded-xl px-3 py-2 hover:bg-red-50 transition">
                    ✕ Limpar
                  </button>
                )}
                <button
                  onClick={handleConfirmar}
                  disabled={!condicaoSel}
                  className="flex-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl py-2 font-bold shadow-md shadow-indigo-500/20 transition"
                >
                  ✓ Confirmar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-slate-400">
              <div className="text-3xl mb-2">🦷</div>
              <p className="text-sm font-medium">Clique em um dente na imagem para registrar a condição</p>
            </div>
          )}

          {/* Legenda */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Legenda</p>
            <div className="flex flex-col gap-1.5">
              {CONDICOES.map(c => (
                <span key={c.id} className="flex items-center gap-2 text-xs font-semibold"
                  style={{ color: c.stroke }}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.fill, border: `1.5px solid ${c.stroke}` }} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* Alterações registradas */}
          {todasAlteracoes.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alterações registradas</p>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {todasAlteracoes.map(([num, val]) => {
                  const c = getCondicao(val.condicao);
                  if (!c) return null;
                  return (
                    <button
                      key={num}
                      onClick={() => handleDenteClick(parseInt(num))}
                      className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-left hover:opacity-80 transition"
                      style={{ background: c.fill + '33', color: c.stroke, border: `1px solid ${c.stroke}66` }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.fill, border: `1px solid ${c.stroke}` }} />
                      <span>Dente {num}: {c.label}</span>
                      {val.observacao && <span className="text-slate-400 ml-1">— {val.observacao}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
              </>
            );
          } catch (err) {
            return (
              <div className="p-8 w-full bg-red-100 border-2 border-red-500 rounded-xl">
                <h3 className="text-xl font-bold text-red-700">Erro fatal de renderização no Odontograma</h3>
                <pre className="mt-4 p-4 text-sm bg-white text-red-900 rounded shadow overflow-auto">
                  {err.stack || err.message}
                </pre>
              </div>
            );
          }
        })()}
      </div>
    </section>
  );
};

export default Odontograma;
