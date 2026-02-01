const TASKS = [
    {
        text: "Die Europäische Zentralbank (EZB) erhöht den Leitzins überraschend stark.",
        d_dir: 1, s_dir: 0,
        explanation: "Höhere Zinsen im Euroraum machen Euro-Anlagen attraktiver. Internationale Investoren fragen mehr Euro nach (D nach rechts)."
    },
    {
        text: "US-Investoren verlieren das Vertrauen in die europäische Wirtschaft.",
        d_dir: -1, s_dir: 0,
        explanation: "Aufgrund schlechter Aussichten wollen weniger Investoren in Europa anlegen. Die Nachfrage nach Euro sinkt (D nach links)."
    },
    {
        // OLD: "Die USA erhöhen ihre Zinsen deutlich stärker als die Europäische Zentralbank." (Double Shift)
        // REDESIGNED: Single Shift (Supply Increase)
        text: "Europäische Fondsmanager schichten Kapital massiv in den US-Technolgiesektor um.",
        d_dir: 0, s_dir: 1,
        explanation: "Um US-Aktien zu kaufen, müssen die Fondsmanager ihre Euro verkaufen. Das Angebot an Euro auf dem Devisenmarkt steigt (S nach rechts)."
    },
    {
        text: "Europäische Unternehmen exportieren Rekordmengen in die USA.",
        d_dir: 1, s_dir: 0,
        explanation: "US-Importeure benötigen Euro, um die europäischen Waren zu bezahlen. Die Nachfrage nach Euro steigt (D nach rechts)."
    },
    {
        text: "Europäische Touristen reisen massenhaft in den USA-Urlaub.",
        d_dir: 0, s_dir: 1,
        explanation: "Für die Reisekosten müssen Touristen Euro in Dollar tauschen. Sie bieten Euro an. Das Angebot steigt (S nach rechts)."
    }
];

class MarketSimulation {
    constructor() {
        this.canvas = document.getElementById('marketChart');
        this.ctx = this.canvas.getContext('2d');
        this.currentRateEl = document.getElementById('currentRate');
        this.demandSlider = document.getElementById('demandSlider');
        this.supplySlider = document.getElementById('supplySlider');
        this.analysisTextEl = document.getElementById('analysisText');
        this.taskDescEl = document.getElementById('taskDescription');
        this.taskFeedbackEl = document.getElementById('taskFeedback');
        this.nextTaskBtn = document.getElementById('nextTaskBtn');
        this.taskCounterEl = document.getElementById('taskCounter');

        this.baseDemand = 0;
        this.baseSupply = 0;
        this.currentTaskIndex = -1;
        this.taskCount = 0;

        // Safe Margins
        this.margin = { top: 60, right: 60, bottom: 60, left: 80 };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.demandSlider.addEventListener('input', (e) => this.handleInput(e, 'd'));
        this.supplySlider.addEventListener('input', (e) => this.handleInput(e, 's'));
        this.nextTaskBtn.addEventListener('click', () => this.nextTask());

        this.nextTask();
    }

    handleInput(e, type) {
        if (type === 'd') this.baseDemand = parseInt(e.target.value);
        if (type === 's') this.baseSupply = parseInt(e.target.value);
        this.draw();
        this.checkTask();
        this.updateInfo();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.draw();
    }

    toScreenX(val) {
        const w = this.canvas.width - (this.margin.left + this.margin.right);
        return this.margin.left + (val / 120) * w;
    }

    toScreenY(val) {
        const h = this.canvas.height - (this.margin.top + this.margin.bottom);
        return this.canvas.height - this.margin.bottom - (val / 120) * h;
    }

    nextTask() {
        this.baseDemand = 0; this.baseSupply = 0;
        this.demandSlider.value = 0; this.supplySlider.value = 0;
        let newIndex;
        do { newIndex = Math.floor(Math.random() * TASKS.length); }
        while (newIndex === this.currentTaskIndex && TASKS.length > 1);

        this.currentTaskIndex = newIndex;
        this.taskCount++;
        this.taskCounterEl.textContent = ((this.taskCount - 1) % 5) + 1;

        this.taskDescEl.textContent = TASKS[this.currentTaskIndex].text;
        this.taskFeedbackEl.className = 'task-feedback';
        this.taskFeedbackEl.innerHTML = '';
        this.nextTaskBtn.textContent = "Überspringen";

        this.draw();
        this.updateInfo();
    }

    checkTask() {
        const task = TASKS[this.currentTaskIndex];
        const d = this.baseDemand;
        const s = this.baseSupply;
        const TH = 15; // Threshold for detection
        const dUser = d > TH ? 1 : (d < -TH ? -1 : 0);
        const sUser = s > TH ? 1 : (s < -TH ? -1 : 0);

        let correct = true;
        
        // Strict Single Curve Check:
        // Verification that user moved the CORRECT curve in the CORRECT direction
        // AND did NOT move the other curve (or kept it within negligible range)
        
        if (task.d_dir !== 0) {
            // Demand should move
            if (dUser !== task.d_dir) correct = false;
            // Supply should NOT move
            if (sUser !== 0) correct = false;
        } 
        else if (task.s_dir !== 0) {
            // Supply should move
            if (sUser !== task.s_dir) correct = false;
            // Demand should NOT move
            if (dUser !== 0) correct = false;
        }

        if (correct) {
            this.taskFeedbackEl.innerHTML = `<strong>Richtig!</strong> ${task.explanation}`;
            this.taskFeedbackEl.classList.add('visible', 'success');
            this.nextTaskBtn.textContent = "Nächste Aufgabe";
        } else {
            this.taskFeedbackEl.classList.remove('visible', 'success');
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const d = this.baseDemand;
        const s = this.baseSupply;
        const qEq = (120 + d + s) / 2;
        const pEq = qEq - s;

        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.drawAxes();
        this.drawStaticEquilibrium();
        this.drawSegment((q) => (120 + d) - q, '#f472b6', 'Nachfrage (D)');
        this.drawSegment((q) => q - s, '#34d399', 'Angebot (S)');

        if (qEq >= 0 && pEq >= 0) this.drawEquilibrium(qEq, pEq);

        const displayRate = Math.max(0, (1.00 + ((pEq - 60) / 120))).toFixed(2);
        this.currentRateEl.innerHTML = displayRate + " <span style='font-size:0.7em; opacity:0.7'>$/€</span>";
    }

    drawAxes() {
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        const x0 = this.toScreenX(0);
        const y0 = this.toScreenY(0);
        const xMax = this.toScreenX(120);
        const yMax = this.toScreenY(120);

        // Y Axis
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x0, yMax);
        this.ctx.lineTo(x0 - 5, yMax + 5);
        this.ctx.moveTo(x0, yMax);
        this.ctx.lineTo(x0 + 5, yMax + 5);

        // X Axis
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(xMax, y0);
        this.ctx.lineTo(xMax - 5, y0 - 5);
        this.ctx.moveTo(xMax, y0);
        this.ctx.lineTo(xMax - 5, y0 + 5);
        this.ctx.stroke();

        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '14px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Preis ($ je €)', x0, this.margin.top - 25);
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Menge an Euro', xMax, y0 + 35);
    }

    drawStaticEquilibrium() {
        const x = this.toScreenX(60);
        const y = this.toScreenY(60);
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        this.ctx.setLineDash([6, 6]);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.toScreenX(0), y);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(x, this.toScreenY(0));
        this.ctx.stroke();

        this.ctx.fillStyle = '#94a3b8';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('p₀', this.toScreenX(0) - 20, y + 4);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('q₀', x, this.toScreenY(0) + 25);
        this.ctx.restore();
    }

    drawSegment(func, color, label) {
        this.ctx.strokeStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.beginPath();
        const points = [];
        [0, 120].forEach(q => {
            const p = func(q);
            if (p >= 0 && p <= 120) points.push({ q, p });
        });
        const m = (func(100) - func(0)) / 100;
        if (Math.abs(m) > 0.001) {
            const y0 = func(0);
            const q0 = -y0 / m;
            if (q0 > 0 && q0 < 120) points.push({ q: q0, p: 0 });
            const qMax = (120 - y0) / m;
            if (qMax > 0 && qMax < 120) points.push({ q: qMax, p: 120 });
        }
        points.sort((a, b) => a.q - b.q);

        if (points.length >= 2) {
            const start = points[0];
            const end = points[points.length - 1];
            this.ctx.shadowBlur = 10;
            this.ctx.moveTo(this.toScreenX(start.q), this.toScreenY(start.p));
            this.ctx.lineTo(this.toScreenX(end.q), this.toScreenY(end.p));
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // SMART LABELING
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 14px Outfit';

            const textMetrics = this.ctx.measureText(label);
            const textWidth = textMetrics.width;

            let lblX = this.toScreenX(end.q) + 12; 
            let lblY = this.toScreenY(end.p);

            if (lblX + textWidth > this.canvas.width - 10) {
                lblX = this.toScreenX(end.q) - 12;
                this.ctx.textAlign = 'right';
            } else {
                this.ctx.textAlign = 'left';
            }

            lblY = Math.max(20, Math.min(this.canvas.height - 20, lblY));

            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
            this.ctx.strokeText(label, lblX, lblY);

            this.ctx.fillText(label, lblX, lblY);
        }
    }

    drawEquilibrium(q, p) {
        const x = this.toScreenX(q);
        const y = this.toScreenY(p);
        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.toScreenX(0), y);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(x, this.toScreenY(0));
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowColor = '#fff';
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        if (Math.abs(p - 60) > 2 || Math.abs(q - 60) > 2) {
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'right';
            this.ctx.fillText('p₁', this.toScreenX(0) - 20, y + 4);
            this.ctx.textAlign = 'center';
            this.ctx.fillText('q₁', x, this.toScreenY(0) + 25);
        }
    }

    updateInfo() {
        const d = this.baseDemand;
        const s = this.baseSupply;
        let msg = "Marktstatus: ";
        if (Math.abs(d) < 5 && Math.abs(s) < 5) msg += "Ausgangsgleichgewicht (p₀, q₀).";
        else {
            const priceChange = d - s;
            const qtyChange = d + s;
            let pStr = "unverändert";
            if (priceChange > 5) pStr = "gestiegen";
            if (priceChange < -5) pStr = "gefallen";
            let qStr = "unverändert";
            if (qtyChange > 5) qStr = "gestiegen";
            if (qtyChange < -5) qStr = "gesunken";
            msg += `Der Kurs ist ${pStr}, die Menge ist ${qStr}.`;
        }
        this.analysisTextEl.textContent = msg;
    }
}
document.addEventListener('DOMContentLoaded', () => new MarketSimulation());
