/**
 * Calculadora de Juros Compostos
 * Modern Glassmorphism Design
 * Chart.js + Dark Mode + Accessibility
 */

(function() {
    'use strict';

    // ============================================
    // DOM Elements
    // ============================================
    const form = document.getElementById('calculator-form');
    const btnLimpar = document.getElementById('btn-limpar');
    const resultadosContainer = document.getElementById('resultados-container');
    const emptyState = document.getElementById('empty-state');
    const btnTheme = document.getElementById('btn-theme');

    // Form fields
    const campoCapital = document.getElementById('capital');
    const campoTaxa = document.getElementById('taxa');
    const campoTempo = document.getElementById('tempo');
    const campoAporte = document.getElementById('aporte');

    // Result elements
    const elMontanteFinal = document.getElementById('montante-final');
    const elCapitalInvestido = document.getElementById('capital-investido');
    const elTotalAportes = document.getElementById('total-aportes');
    const elJurosTotais = document.getElementById('juros-totais');
    const elResumoPeriodo = document.getElementById('resumo-periodo');
    const elResumoTaxa = document.getElementById('resumo-taxa');
    const elResumoInvestido = document.getElementById('resumo-investido');
    const elResumoRendimento = document.getElementById('resumo-rendimento');
    const tabelaCorpo = document.getElementById('tabela-corpo');

    // Chart
    let chartInstance = null;
    const chartCanvas = document.getElementById('chart-evolucao');

    // ============================================
    // DARK MODE
    // ============================================
    const THEME_KEY = 'juros-compostos-theme';

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function getCurrentTheme() {
        return localStorage.getItem(THEME_KEY) || getSystemTheme();
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        const icon = btnTheme.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'bi bi-sun-fill';
        } else {
            icon.className = 'bi bi-moon-stars-fill';
        }
        // Update chart colors if chart exists
        if (chartInstance) {
            updateChartTheme();
        }
    }

    function toggleTheme() {
        const current = getCurrentTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
    }

    // Initialize theme
    setTheme(getCurrentTheme());
    btnTheme.addEventListener('click', toggleTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // ============================================
    // FORMATTING UTILITIES
    // ============================================
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    }

    function formatarNumero(valor, decimais = 2) {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimais,
            maximumFractionDigits: decimais
        }).format(valor);
    }

    // ============================================
    // ANIMATED COUNTER
    // ============================================
    function animateValue(element, start, end, duration = 800) {
        const startTime = performance.now();
        element.classList.add('animate-count');

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * eased;
            
            element.textContent = formatarMoeda(current);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = formatarMoeda(end);
                element.classList.remove('animate-count');
            }
        }
        
        requestAnimationFrame(update);
    }

    // ============================================
    // FORM VALIDATION
    // ============================================
    function validarFormulario() {
        let valido = true;

        if (!campoCapital.value || parseFloat(campoCapital.value) <= 0) {
            campoCapital.classList.add('is-invalid');
            valido = false;
        } else {
            campoCapital.classList.remove('is-invalid');
        }

        if (!campoTaxa.value || parseFloat(campoTaxa.value) <= 0) {
            campoTaxa.classList.add('is-invalid');
            valido = false;
        } else {
            campoTaxa.classList.remove('is-invalid');
        }

        if (!campoTempo.value || parseInt(campoTempo.value) < 1) {
            campoTempo.classList.add('is-invalid');
            valido = false;
        } else {
            campoTempo.classList.remove('is-invalid');
        }

        return valido;
    }

    function limparErro(evento) {
        evento.target.classList.remove('is-invalid');
    }

    [campoCapital, campoTaxa, campoTempo].forEach(campo => {
        campo.addEventListener('input', limparErro);
    });

    // ============================================
    // CALCULATION
    // ============================================
    function calcularJurosCompostos(capital, taxa, tempo, aporte) {
        const taxaDecimal = taxa / 100;
        const dados = [];
        
        let saldo = capital;
        let totalInvestido = capital;
        let totalAportes = 0;

        for (let mes = 1; mes <= tempo; mes++) {
            const jurosMes = saldo * taxaDecimal;
            
            if (mes > 1 && aporte > 0) {
                saldo += aporte;
                totalAportes += aporte;
                totalInvestido += aporte;
            }
            
            saldo += jurosMes;

            dados.push({
                mes: mes,
                capital: totalInvestido,
                aporte: (mes === 1) ? 0 : aporte,
                juros: jurosMes,
                total: saldo
            });
        }

        const jurosTotais = saldo - totalInvestido;

        return {
            montanteFinal: saldo,
            capitalInvestido: capital,
            totalAportes: totalAportes,
            jurosTotais: jurosTotais,
            totalInvestido: totalInvestido,
            dadosMensais: dados
        };
    }

    // ============================================
    // CHART RENDERING
    // ============================================
    function getChartColors() {
        const isDark = getCurrentTheme() === 'dark';
        return {
            primary: isDark ? '#10b981' : '#0f7b4f',
            primaryLight: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(15,123,79,0.1)',
            gold: isDark ? '#f59e0b' : '#d97706',
            goldLight: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(217,119,6,0.1)',
            text: isDark ? '#94a3b8' : '#64748b',
            grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            tooltip: isDark ? '#1e293b' : '#fff',
            tooltipText: isDark ? '#e2e8f0' : '#334155',
            tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        };
    }

    function renderChart(dados) {
        const colors = getChartColors();
        
        // Sample data for large datasets (show max 60 points for readability)
        const step = Math.max(1, Math.floor(dados.length / 60));
        const labels = [];
        const totalsData = [];
        const investedData = [];
        const interestData = [];

        for (let i = 0; i < dados.length; i += step) {
            const d = dados[i];
            labels.push(d.mes);
            totalsData.push(d.total);
            investedData.push(d.capital);
            interestData.push(d.total - d.capital);
        }

        // Make sure last point is always included
        const lastData = dados[dados.length - 1];
        if (labels[labels.length - 1] !== lastData.mes) {
            labels.push(lastData.mes);
            totalsData.push(lastData.total);
            investedData.push(lastData.capital);
            interestData.push(lastData.total - lastData.capital);
        }

        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = chartCanvas.getContext('2d');

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Montante Total',
                        data: totalsData,
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: colors.primary,
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        order: 1
                    },
                    {
                        label: 'Total Investido',
                        data: investedData,
                        borderColor: colors.gold,
                        backgroundColor: colors.goldLight,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: colors.gold,
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: colors.text,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                                weight: '600'
                            },
                            usePointStyle: true,
                            pointStyleWidth: 12,
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.tooltip,
                        titleColor: colors.tooltipText,
                        bodyColor: colors.tooltipText,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 14,
                        titleFont: {
                            family: "'Inter', sans-serif",
                            size: 13,
                            weight: '700'
                        },
                        bodyFont: {
                            family: "'JetBrains Mono', monospace",
                            size: 12
                        },
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: function(items) {
                                return 'Mês ' + items[0].label;
                            },
                            label: function(item) {
                                return ' ' + item.dataset.label + ': ' + formatarMoeda(item.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: colors.grid,
                            drawBorder: false
                        },
                        ticks: {
                            color: colors.text,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            },
                            maxTicksLimit: 12,
                            callback: function(value, index) {
                                const label = this.getLabelForValue(value);
                                return 'Mês ' + label;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Período (meses)',
                            color: colors.text,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                                weight: '600'
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: colors.grid,
                            drawBorder: false
                        },
                        ticks: {
                            color: colors.text,
                            font: {
                                family: "'JetBrains Mono', monospace",
                                size: 11
                            },
                            callback: function(value) {
                                if (value >= 1000000) return 'R$ ' + (value / 1000000).toFixed(1) + 'M';
                                if (value >= 1000) return 'R$ ' + (value / 1000).toFixed(0) + 'K';
                                return 'R$ ' + value;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                            color: colors.text,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        });
    }

    function updateChartTheme() {
        // Re-render chart with new colors
        if (chartInstance && chartInstance.data) {
            const lastData = chartInstance.data.datasets[0].data;
            // We need to recalculate - simplest is to destroy and rebuild
            // But we don't have the raw data, so we'll just update colors
            const colors = getChartColors();
            
            chartInstance.data.datasets[0].borderColor = colors.primary;
            chartInstance.data.datasets[0].backgroundColor = colors.primaryLight;
            chartInstance.data.datasets[0].pointHoverBackgroundColor = colors.primary;
            chartInstance.data.datasets[1].borderColor = colors.gold;
            chartInstance.data.datasets[1].backgroundColor = colors.goldLight;
            chartInstance.data.datasets[1].pointHoverBackgroundColor = colors.gold;
            
            chartInstance.options.plugins.legend.labels.color = colors.text;
            chartInstance.options.plugins.tooltip.backgroundColor = colors.tooltip;
            chartInstance.options.plugins.tooltip.titleColor = colors.tooltipText;
            chartInstance.options.plugins.tooltip.bodyColor = colors.tooltipText;
            chartInstance.options.plugins.tooltip.borderColor = colors.tooltipBorder;
            chartInstance.options.scales.x.grid.color = colors.grid;
            chartInstance.options.scales.x.ticks.color = colors.text;
            chartInstance.options.scales.x.title.color = colors.text;
            chartInstance.options.scales.y.grid.color = colors.grid;
            chartInstance.options.scales.y.ticks.color = colors.text;
            chartInstance.options.scales.y.title.color = colors.text;
            
            chartInstance.update('none');
        }
    }

    // ============================================
    // TABLE RENDERING
    // ============================================
    function renderizarTabela(dados) {
        let html = '';
        const maximoExibicao = Math.min(dados.length, 120);
        
        for (let i = 0; i < maximoExibicao; i++) {
            const linha = dados[i];
            html += `
                <tr>
                    <td><strong>${linha.mes}</strong></td>
                    <td>${formatarMoeda(linha.capital)}</td>
                    <td>${linha.aporte > 0 ? formatarMoeda(linha.aporte) : '<span class="text-muted">—</span>'}</td>
                    <td class="text-success fw-bold">+ ${formatarMoeda(linha.juros)}</td>
                    <td class="fw-bold">${formatarMoeda(linha.total)}</td>
                </tr>
            `;
        }

        if (dados.length > maximoExibicao) {
            html += `
                <tr>
                    <td colspan="5" class="text-center text-muted py-3">
                        <i class="bi bi-info-circle me-2"></i>
                        Exibindo os primeiros ${maximoExibicao} meses de ${dados.length} totais.
                    </td>
                </tr>
            `;
        }

        tabelaCorpo.innerHTML = html;
    }

    // ============================================
    // DISPLAY RESULTS
    // ============================================
    function exibirResultados(resultado, taxa, tempo) {
        // Animate main values
        animateValue(elMontanteFinal, 0, resultado.montanteFinal, 1200);
        
        // Set static values immediately
        elCapitalInvestido.textContent = formatarMoeda(resultado.capitalInvestido);
        elTotalAportes.textContent = formatarMoeda(resultado.totalAportes);
        elJurosTotais.textContent = formatarMoeda(resultado.jurosTotais);

        // Update summary
        elResumoPeriodo.textContent = `${tempo} ${tempo === 1 ? 'mês' : 'meses'}`;
        elResumoTaxa.textContent = `${formatarNumero(taxa)}% a.m`;
        elResumoInvestido.textContent = formatarMoeda(resultado.totalInvestido);
        elResumoRendimento.textContent = formatarMoeda(resultado.jurosTotais);

        // Render chart
        renderChart(resultado.dadosMensais);

        // Render table
        renderizarTabela(resultado.dadosMensais);

        // Show results, hide empty state
        emptyState.style.display = 'none';
        resultadosContainer.style.display = 'block';

        // Smooth scroll to results on mobile
        if (window.innerWidth < 992) {
            setTimeout(() => {
                resultadosContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    // ============================================
    // CLEAR
    // ============================================
    function limparTudo() {
        form.reset();
        
        [campoCapital, campoTaxa, campoTempo].forEach(campo => {
            campo.classList.remove('is-invalid');
        });

        resultadosContainer.style.display = 'none';
        emptyState.style.display = 'block';
        tabelaCorpo.innerHTML = '';

        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        campoCapital.focus();
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================
    form.addEventListener('submit', function(evento) {
        evento.preventDefault();
        evento.stopPropagation();

        if (!validarFormulario()) {
            return;
        }

        const capital = parseFloat(campoCapital.value) || 0;
        const taxa = parseFloat(campoTaxa.value) || 0;
        const tempo = parseInt(campoTempo.value) || 0;
        const aporte = parseFloat(campoAporte.value) || 0;

        if (tempo > 600) {
            if (!confirm('O período informado é muito longo (' + tempo + ' meses). Deseja continuar?')) {
                return;
            }
        }

        const resultado = calcularJurosCompostos(capital, taxa, tempo, aporte);
        exibirResultados(resultado, taxa, tempo);
    });

    btnLimpar.addEventListener('click', limparTudo);

    // Auto focus
    campoCapital.focus();

    // Keyboard shortcut: Ctrl+Enter
    document.addEventListener('keydown', function(evento) {
        if (evento.ctrlKey && evento.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
    });

    // ============================================
    // SERVICE WORKER REGISTRATION (SEO - PWA)
    // ============================================
    if ('serviceWorker' in navigator) {
        // Service worker can be added later for offline support
        // navigator.serviceWorker.register('/sw.js');
    }

})();