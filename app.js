const { useState, useEffect, useRef, useCallback } = React;

// ===== RADAR CHART COMPONENT =====
function RadarChart({ results, target }) {
  const canvasRef = useRef(null);
  const metrics = ['SHGC', 'VLT', 'ER', 'IR', 'UValue'];
  const labels = ['SHGC', 'VLT %', 'Ext Refl %', 'Int Refl %', 'U-Value'];
  const maxVals = { SHGC: 1, VLT: 100, ER: 50, IR: 50, UValue: 6 };
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#00D4FF'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 400, H = 400, cx = W / 2, cy = H / 2, R = 140;
    canvas.width = W * 2; canvas.height = H * 2;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, W, H);

    const n = metrics.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    // Draw grid
    for (let ring = 1; ring <= 5; ring++) {
      const r = (R / 5) * ring;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = startAngle + i * angleStep;
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axes and labels
    for (let i = 0; i < n; i++) {
      const a = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.stroke();
      const lx = cx + (R + 24) * Math.cos(a), ly = cy + (R + 24) * Math.sin(a);
      ctx.fillStyle = '#8b95b0';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
    }

    // Draw target polygon
    function drawPoly(data, color, fill) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = startAngle + i * angleStep;
        const v = Math.min((data[metrics[i]] || 0) / maxVals[metrics[i]], 1);
        const x = cx + R * v * Math.cos(a), y = cy + R * v * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (fill) { ctx.fillStyle = color + '18'; ctx.fill(); }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Target dashed
    ctx.setLineDash([6, 4]);
    drawPoly(target, '#00D4FF', false);
    ctx.setLineDash([]);

    // Results
    results.forEach((r, i) => drawPoly(r, colors[i], true));
  }, [results, target]);

  return React.createElement('canvas', { ref: canvasRef, style: { maxWidth: '100%' } });
}

// ===== PERFORMANCE BAR =====
function PerfBar({ label, value, max, targetVal }) {
  const pct = Math.min((value / max) * 100, 100);
  const diff = value - targetVal;
  let colorClass = 'blue';
  if (Math.abs(diff) < 0.01 * max) colorClass = 'yellow';
  else if ((label === 'SHGC' || label === 'U-Value') && diff < 0) colorClass = 'green';
  else if ((label === 'SHGC' || label === 'U-Value') && diff > 0) colorClass = 'red';
  else if (label === 'VLT' && diff > 0) colorClass = 'green';
  else if (label === 'VLT' && diff < 0) colorClass = 'red';

  return React.createElement('div', { className: 'perf-row' },
    React.createElement('span', { className: 'perf-label' }, label),
    React.createElement('div', { className: 'perf-bar-bg' },
      React.createElement('div', { className: 'perf-bar-fill ' + colorClass, style: { width: pct + '%' } })
    ),
    React.createElement('span', { className: 'perf-val' },
      typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(2)) : value
    )
  );
}

// ===== RESULT CARD =====
function ResultCard({ result, index, target }) {
  const cls = result.classification;
  const badgeCls = 'card-badge badge-' + cls;
  const badgeText = cls === 'superior' ? '★ Better Performance' : cls === 'closest' ? '≈ Equivalent' : '▼ Value Option';
  const tagLabels = { daylight: 'Daylight Optimized', energy: 'Energy Efficient', cost: 'Cost Effective' };

  return React.createElement('div', { className: 'result-card ' + cls },
    React.createElement('div', { className: 'card-rank' }, '#' + (index + 1)),
    React.createElement('div', { className: badgeCls }, badgeText),
    React.createElement('div', { className: 'card-product-name' }, result.ProductName),
    React.createElement('div', { className: 'card-brand' }, 'Saint-Gobain'),
    React.createElement('div', { className: 'card-meta' },
      React.createElement('span', { className: 'meta-tag' }, result.GlazingType),
      React.createElement('span', { className: 'meta-tag' }, result.Shade),
      React.createElement('span', { className: 'meta-tag' }, result.Standard)
    ),
    React.createElement('div', { className: 'perf-bars' },
      React.createElement(PerfBar, { label: 'SHGC', value: result.SHGC, max: 1, targetVal: target.SHGC || 0 }),
      React.createElement(PerfBar, { label: 'VLT', value: result.VLT, max: 100, targetVal: target.VLT || 0 }),
      React.createElement(PerfBar, { label: 'ER', value: result.ER, max: 50, targetVal: target.ER || 0 }),
      React.createElement(PerfBar, { label: 'IR', value: result.IR, max: 50, targetVal: target.IR || 0 }),
      React.createElement(PerfBar, { label: 'U-Value', value: result.UValue, max: 6, targetVal: target.UValue || 0 })
    ),
    result.recTags.length > 0 && React.createElement('div', { className: 'rec-tags' },
      result.recTags.map(t => React.createElement('span', { key: t, className: 'rec-tag ' + t }, tagLabels[t]))
    ),
    React.createElement('div', { className: 'why-section' },
      React.createElement('div', { className: 'why-title' }, '💡 Why this match'),
      result.explanations.map((e, i) => React.createElement('div', { key: i, className: 'why-item' }, e))
    ),
    React.createElement('div', { className: 'score-badge' }, 'Score: ' + result.score.toFixed(1))
  );
}

// ===== TABLE VIEW =====
function TableView({ results, target }) {
  const clsColors = { superior: 'var(--green)', closest: 'var(--yellow)', inferior: 'var(--red)' };
  return React.createElement('div', { className: 'results-table-wrap' },
    React.createElement('table', { className: 'results-table' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          ['#', 'Product', 'Type', 'Shade', 'SHGC', 'VLT %', 'ER %', 'IR %', 'U-Value', 'Score', 'Classification'].map(h =>
            React.createElement('th', { key: h }, h)
          )
        )
      ),
      React.createElement('tbody', null,
        results.map((r, i) =>
          React.createElement('tr', { key: i },
            React.createElement('td', null, i + 1),
            React.createElement('td', { style: { fontWeight: 600 } }, r.ProductName),
            React.createElement('td', null, r.GlazingType),
            React.createElement('td', null, r.Shade),
            React.createElement('td', null, r.SHGC),
            React.createElement('td', null, r.VLT),
            React.createElement('td', null, r.ER),
            React.createElement('td', null, r.IR),
            React.createElement('td', null, r.UValue),
            React.createElement('td', null, r.score.toFixed(1)),
            React.createElement('td', { style: { color: clsColors[r.classification], fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' } }, r.classification)
          )
        )
      )
    )
  );
}

// ===== MAIN APP =====
function App() {
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [mode, setMode] = useState('product');
  const [viewMode, setViewMode] = useState('cards');
  const [results, setResults] = useState([]);
  const [target, setTarget] = useState({});
  const [searched, setSearched] = useState(false);

  // Product mode state
  const [selBrand, setSelBrand] = useState('');
  const [selProduct, setSelProduct] = useState('');
  const [brandProducts, setBrandProducts] = useState([]);

  // Performance mode state
  const [perfSHGC, setPerfSHGC] = useState(0.35);
  const [perfVLT, setPerfVLT] = useState(40);
  const [perfER, setPerfER] = useState(20);
  const [perfIR, setPerfIR] = useState(15);
  const [perfUValue, setPerfUValue] = useState(2.0);
  const [perfShade, setPerfShade] = useState('Neutral');
  const [perfGlazing, setPerfGlazing] = useState('DGU');
  const [perfStandard, setPerfStandard] = useState('EN');

  useEffect(() => {
    GlassEngine.loadData().then(() => {
      setDataLoaded(true);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selBrand) {
      const prods = GlassEngine.getProductsByBrand(selBrand);
      const unique = [...new Map(prods.map(p => [p.ProductName, p])).values()];
      unique.sort((a, b) => a.ProductName.localeCompare(b.ProductName));
      setBrandProducts(unique);
      setSelProduct('');
    }
  }, [selBrand]);

  const handleProductSearch = useCallback(() => {
    if (!selBrand || !selProduct) return;
    const all = GlassEngine.getProducts();
    const source = all.find(p => p.Brand === selBrand && p.ProductName === selProduct);
    if (!source) return;
    const t = { SHGC: source.SHGC, VLT: source.VLT, ER: source.ER, IR: source.IR, UValue: source.UValue, Shade: source.Shade, GlazingType: source.GlazingType, Standard: source.Standard };
    setTarget(t);
    setResults(GlassEngine.findMatches(t));
    setSearched(true);
  }, [selBrand, selProduct]);

  const handlePerfSearch = useCallback(() => {
    const t = { SHGC: perfSHGC, VLT: perfVLT, ER: perfER, IR: perfIR, UValue: perfUValue, Shade: perfShade, GlazingType: perfGlazing, Standard: perfStandard };
    setTarget(t);
    setResults(GlassEngine.findMatches(t));
    setSearched(true);
  }, [perfSHGC, perfVLT, perfER, perfIR, perfUValue, perfShade, perfGlazing, perfStandard]);

  const handleExportPDF = useCallback(() => {
    const element = document.getElementById('pdf-export-content');
    if (!element) return;
    element.classList.add('pdf-mode');
    const opt = {
      margin:       10,
      filename:     'SG_Comparator_Report.pdf',
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0a0e1a' },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save().then(() => {
      element.classList.remove('pdf-mode');
    });
  }, []);

  if (loading || !dataLoaded) {
    return React.createElement('div', { className: 'app-container' },
      React.createElement('div', { className: 'loading-container' },
        React.createElement('div', { className: 'loading-spinner' }),
        React.createElement('div', { className: 'loading-text' }, 'Loading product database...')
      )
    );
  }

  const shades = GlassEngine.getUniqueValues('Shade');

  // ===== RENDER =====
  return React.createElement('div', { className: 'app-container' },
    // Header
    React.createElement('header', { className: 'header' },
      React.createElement('div', { className: 'header-brand' },
        React.createElement('div', null,
          React.createElement('div', { className: 'header-title' }, 'Glass ', React.createElement('span', null, 'Comparator')),
          React.createElement('div', { className: 'header-subtitle' }, 'Professional Selection Tool')
        )
      ),
      React.createElement('div', { className: 'header-actions' },
        searched && React.createElement('div', { className: 'export-section' },
          React.createElement('button', { className: 'export-btn', onClick: handleExportPDF }, '📄 PDF'),
          React.createElement('button', { className: 'export-btn', onClick: () => GlassEngine.exportExcel(results, target) }, '📊 Excel')
        )
      )
    ),

    React.createElement('main', { className: 'main-content' },
      // Hero
      React.createElement('div', { className: 'hero-section' },
        React.createElement('h1', { className: 'hero-title' }, 'Find the Perfect Saint-Gobain Match'),
        React.createElement('p', { className: 'hero-desc' }, 'Compare competitor products or define performance specs to discover the top 3 equivalent Saint-Gobain glass solutions.')
      ),

      // Mode Switcher
      React.createElement('div', { className: 'mode-switcher' },
        React.createElement('button', { className: 'mode-btn' + (mode === 'product' ? ' active' : ''), onClick: () => setMode('product') }, '🔍 Product Search'),
        React.createElement('button', { className: 'mode-btn' + (mode === 'performance' ? ' active' : ''), onClick: () => setMode('performance') }, '⚙️ Performance Search')
      ),

      // ===== PRODUCT MODE =====
      mode === 'product' && React.createElement('div', { className: 'input-panel' },
        React.createElement('div', { className: 'input-grid' },
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'Brand'),
            React.createElement('select', { className: 'field-select', value: selBrand, onChange: e => setSelBrand(e.target.value) },
              React.createElement('option', { value: '' }, 'Select Brand'),
              React.createElement('option', { value: 'Asahi' }, 'Asahi Glass (AIS)'),
              React.createElement('option', { value: 'Guardian' }, 'Guardian Glass'),
              React.createElement('option', { value: 'Saint-Gobain' }, 'Saint-Gobain')
            )
          ),
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'Product'),
            React.createElement('select', { className: 'field-select', value: selProduct, onChange: e => setSelProduct(e.target.value), disabled: !selBrand },
              React.createElement('option', { value: '' }, selBrand ? 'Select Product' : 'Select brand first'),
              brandProducts.map(p => React.createElement('option', { key: p.ProductName, value: p.ProductName }, p.ProductName))
            )
          )
        ),
        React.createElement('div', { className: 'btn-row' },
          React.createElement('button', { className: 'btn-primary', onClick: handleProductSearch, disabled: !selBrand || !selProduct }, '🔎 Find SG Matches')
        )
      ),

      // ===== PERFORMANCE MODE =====
      mode === 'performance' && React.createElement('div', { className: 'input-panel' },
        React.createElement('div', { className: 'input-grid' },
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'SHGC (Solar Factor)'),
            React.createElement('div', { className: 'slider-row' },
              React.createElement('input', { type: 'range', min: 0.05, max: 0.9, step: 0.01, value: perfSHGC, onChange: e => setPerfSHGC(parseFloat(e.target.value)) }),
              React.createElement('span', { className: 'slider-value' }, perfSHGC.toFixed(2))
            )
          ),
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'VLT (%)'),
            React.createElement('div', { className: 'slider-row' },
              React.createElement('input', { type: 'range', min: 5, max: 95, step: 1, value: perfVLT, onChange: e => setPerfVLT(parseInt(e.target.value)) }),
              React.createElement('span', { className: 'slider-value' }, perfVLT + '%')
            )
          ),
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'External Reflection (%)'),
            React.createElement('div', { className: 'slider-row' },
              React.createElement('input', { type: 'range', min: 5, max: 50, step: 1, value: perfER, onChange: e => setPerfER(parseInt(e.target.value)) }),
              React.createElement('span', { className: 'slider-value' }, perfER + '%')
            )
          ),
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'Internal Reflection (%)'),
            React.createElement('div', { className: 'slider-row' },
              React.createElement('input', { type: 'range', min: 2, max: 50, step: 1, value: perfIR, onChange: e => setPerfIR(parseInt(e.target.value)) }),
              React.createElement('span', { className: 'slider-value' }, perfIR + '%')
            )
          ),
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'U-Value (W/m²K)'),
            React.createElement('div', { className: 'slider-row' },
              React.createElement('input', { type: 'range', min: 1, max: 6, step: 0.1, value: perfUValue, onChange: e => setPerfUValue(parseFloat(e.target.value)) }),
              React.createElement('span', { className: 'slider-value' }, perfUValue.toFixed(1))
            )
          ),
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'Shade'),
            React.createElement('select', { className: 'field-select', value: perfShade, onChange: e => setPerfShade(e.target.value) },
              shades.map(s => React.createElement('option', { key: s, value: s }, s))
            )
          ),
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'Glazing Type'),
            React.createElement('select', { className: 'field-select', value: perfGlazing, onChange: e => setPerfGlazing(e.target.value) },
              React.createElement('option', { value: 'SGU' }, 'SGU (Single)'),
              React.createElement('option', { value: 'DGU' }, 'DGU (Double)')
            )
          ),
          React.createElement('div', { className: 'field-group' },
            React.createElement('label', { className: 'field-label' }, 'Standard'),
            React.createElement('select', { className: 'field-select', value: perfStandard, onChange: e => setPerfStandard(e.target.value) },
              React.createElement('option', { value: 'EN' }, 'EN'),
              React.createElement('option', { value: 'NFRC' }, 'NFRC')
            )
          )
        ),
        React.createElement('div', { className: 'btn-row' },
          React.createElement('button', { className: 'btn-primary', onClick: handlePerfSearch }, '🔎 Find SG Matches')
        )
      ),

      // ===== RESULTS =====
      searched && results.length > 0 && React.createElement('div', { id: 'pdf-export-content', style: { marginTop: 40 } },
        React.createElement('div', { className: 'target-ref' },
          React.createElement('span', { className: 'target-ref-label' }, '🎯 Target Profile'),
          React.createElement('div', { className: 'target-ref-values' },
            React.createElement('span', { className: 'target-val' }, 'SHGC: ', React.createElement('strong', null, target.SHGC)),
            React.createElement('span', { className: 'target-val' }, 'VLT: ', React.createElement('strong', null, target.VLT, '%')),
            React.createElement('span', { className: 'target-val' }, 'ER: ', React.createElement('strong', null, target.ER, '%')),
            React.createElement('span', { className: 'target-val' }, 'IR: ', React.createElement('strong', null, target.IR, '%')),
            React.createElement('span', { className: 'target-val' }, 'U: ', React.createElement('strong', null, target.UValue)),
            React.createElement('span', { className: 'target-val' }, 'Shade: ', React.createElement('strong', null, target.Shade)),
            React.createElement('span', { className: 'target-val' }, React.createElement('strong', null, target.GlazingType))
          )
        ),

        React.createElement('div', { className: 'results-header' },
          React.createElement('h2', { className: 'results-title' }, 'Top 3 ', React.createElement('span', null, 'Saint-Gobain'), ' Matches'),
          React.createElement('div', { className: 'view-toggle' },
            React.createElement('button', { className: 'view-btn' + (viewMode === 'cards' ? ' active' : ''), onClick: () => setViewMode('cards') }, '▦ Cards'),
            React.createElement('button', { className: 'view-btn' + (viewMode === 'table' ? ' active' : ''), onClick: () => setViewMode('table') }, '≡ Table')
          )
        ),

        viewMode === 'cards'
          ? React.createElement('div', { className: 'cards-grid' },
              results.map((r, i) => React.createElement(ResultCard, { key: i, result: r, index: i, target: target }))
            )
          : React.createElement(TableView, { results: results, target: target }),

        React.createElement('div', { className: 'radar-section' },
          React.createElement('div', { className: 'radar-title' }, '📊 Performance Comparison Radar'),
          React.createElement('div', { className: 'radar-container' },
            React.createElement(RadarChart, { results: results, target: target }),
            React.createElement('div', { className: 'radar-legend' },
              React.createElement('div', { className: 'legend-item' },
                React.createElement('div', { className: 'legend-dot', style: { background: '#00D4FF', border: '2px dashed #00D4FF', width: 14, height: 14 } }),
                'Target Profile'
              ),
              results.map((r, i) => {
                const c = ['#10b981', '#f59e0b', '#ef4444'][i];
                return React.createElement('div', { key: i, className: 'legend-item' },
                  React.createElement('div', { className: 'legend-dot', style: { background: c } }),
                  '#' + (i+1) + ' ' + r.ProductName
                );
              })
            )
          )
        )
      ),

      searched && results.length === 0 && React.createElement('div', { className: 'no-results' },
        React.createElement('div', { className: 'no-results-icon' }, '🔍'),
        React.createElement('div', { className: 'no-results-title' }, 'No matches found'),
        React.createElement('p', null, 'Try adjusting your search criteria or relaxing the filters.')
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
