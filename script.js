class MarketSimulation {
    constructor() {
        this.canvas = document.getElementById('marketChart');
        this.ctx = this.canvas.getContext('2d');
        this.demandSlider = document.getElementById('demandSlider');
        this.supplySlider = document.getElementById('supplySlider');
        this.currentRateEl = document.getElementById('currentRate');
        this.analysisTextEl = document.getElementById('analysisText');

        // State
        this.baseDemand = 0; // Shift value
        this.baseSupply = 0; // Shift value

        // Canvas dimensions setup
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Event Listeners
        this.demandSlider.addEventListener('input', (e) => {
            this.baseDemand = parseInt(e.target.value);
            this.draw();
            this.updateInfo();
        });

        this.supplySlider.addEventListener('input', (e) => {
            this.baseSupply = parseInt(e.target.value);
            this.draw();
            this.updateInfo();
        });

        // Initial Draw
        this.draw();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.draw();
    }

    // Coordinate conversion
    // Map abstract 0-100 logic space to canvas pixels
    toScreenX(val) {
        const padding = 60;
        const usefulWidth = this.canvas.width - (padding * 2);
        return padding + (val / 100) * usefulWidth;
    }

    toScreenY(val) {
        const padding = 60;
        const usefulHeight = this.canvas.height - (padding * 2);
        // Invert Y because canvas 0 is top
        return this.canvas.height - padding - (val / 100) * usefulHeight;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Core logic: Line equations y = mx + c
        // Demand: negative slope. Supply: positive slope.
        // Let's say range is 0-100 for P (Price/Rate) and Q (Quantity)

        // Demand: P = -Q + 100 + shift
        // Supply: P = Q + shift

        // Intersection:
        // Q + S_shift = -Q + 100 + D_shift
        // 2Q = 100 + D_shift - S_shift
        // Q_eq = 50 + (D_shift - S_shift) / 2
        // P_eq = Q_eq + S_shift 
        //      = 50 + D/2 - S/2 + S 
        //      = 50 + (D_shift + S_shift) / 2

        // Core logic:
        // Demand slider (d): Positive = Increase (Right shift) -> Price Up
        // Supply slider (s): Positive = Increase (Right shift) -> Price Down

        const d = this.baseDemand;
        const s = this.baseSupply; // Positive s means Supply Increase

        // Math:
        // Demand Curve: P = (100 - Q) + d
        // Supply Curve: P = Q - s   (Negative s shift lowers price for same Q)

        // Intersection:
        // 100 - Q + d = Q - s
        // 2Q = 100 + d + s
        // Q_eq = 50 + (d + s) / 2
        // P_eq = Q_eq - s
        //      = 50 + d/2 + s/2 - s
        //      = 50 + (d - s) / 2

        // Calculate Equilibrium
        const qEq = 50 + (d + s) / 2;
        const pEq = 50 + (d - s) / 2;

        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw Axes
        this.drawAxes();

        // Draw Demand Curve (Pink)
        // P = 100 - Q + d
        // Q=10 -> P = 90 + d
        // Q=90 -> P = 10 + d
        this.drawCurve(
            { q: 10, p: 90 + d },
            { q: 90, p: 10 + d },
            '#f472b6',
            'Nachfrage (D)'
        );

        // Draw Supply Curve (Emerald)
        // P = Q - s
        // Q=10 -> P = 10 - s
        // Q=90 -> P = 90 - s
        this.drawCurve(
            { q: 10, p: 10 - s },
            { q: 90, p: 90 - s },
            '#34d399',
            'Angebot (S)'
        );

        // Draw Equilibrium Point and Lines
        this.drawEquilibrium(qEq, pEq);

        // Update Text Display
        // Base rate 1.00 corresponds to pEq = 50. 
        const displayRate = Math.max(0, (0.5 + (pEq / 100))).toFixed(2);
        this.currentRateEl.textContent = displayRate;
    }

    drawAxes() {
        this.ctx.strokeStyle = '#94a3b8'; // text-secondary
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // Y Axis (Exchange Rate)
        this.ctx.moveTo(this.toScreenX(0), this.toScreenY(100));
        this.ctx.lineTo(this.toScreenX(0), this.toScreenY(0));

        // X Axis (Quantity)
        this.ctx.lineTo(this.toScreenX(100), this.toScreenY(0));

        this.ctx.stroke();

        // Labels
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '14px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Menge', this.toScreenX(50), this.toScreenY(0) + 40);

        this.ctx.save();
        this.ctx.translate(this.toScreenX(0) - 40, this.toScreenY(50));
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Wechselkurs', 0, 0);
        this.ctx.restore();
    }

    drawCurve(start, end, color, label) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;

        this.ctx.beginPath();
        this.ctx.moveTo(this.toScreenX(start.q), this.toScreenY(start.p));
        this.ctx.lineTo(this.toScreenX(end.q), this.toScreenY(end.p));
        this.ctx.stroke();

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Label
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 14px Outfit';
        this.ctx.textAlign = 'left';
        // Position label slightly past the end
        this.ctx.fillText(label, this.toScreenX(end.q) + 5, this.toScreenY(end.p));
    }

    drawEquilibrium(q, p) {
        const x = this.toScreenX(q);
        const y = this.toScreenY(p);

        // Dashed lines to axes
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        // To Y Axis
        this.ctx.moveTo(this.toScreenX(0), y);
        this.ctx.lineTo(x, y);
        // To X Axis
        this.ctx.lineTo(x, this.toScreenY(0));
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Point
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Glow effect for point
        this.ctx.shadowColor = '#fff';
        this.ctx.shadowBlur = 15;
        this.ctx.stroke(); // stroke outer
        this.ctx.shadowBlur = 0;
    }

    updateInfo() {
        const d = this.baseDemand;
        const s = this.baseSupply;
        let msg = "";

        if (d === 0 && s === 0) {
            msg = "Der Markt befindet sich im ursprünglichen Gleichgewicht.";
        } else {
            const lines = [];
            if (d > 0) lines.push("Die Nachfrage ist gestiegen (Kurve nach rechts).");
            if (d < 0) lines.push("Die Nachfrage ist gesunken (Kurve nach links).");
            if (s > 0) lines.push("Das Angebot ist gestiegen (Kurve nach rechts).");
            if (s < 0) lines.push("Das Angebot ist gesunken (Kurve nach links).");

            // Price analysis
            // P_eq slope approx depends on (d - s)
            const priceChange = (d - s);

            if (priceChange > 10) lines.push("Resultat: Der Wechselkurs ist deutlich gestiegen.");
            else if (priceChange > 0) lines.push("Resultat: Der Wechselkurs ist leicht gestiegen.");
            else if (priceChange < -10) lines.push("Resultat: Der Wechselkurs ist deutlich gefallen.");
            else if (priceChange < 0) lines.push("Resultat: Der Wechselkurs ist leicht gefallen.");
            else lines.push("Resultat: Der Wechselkurs ist unverändert geblieben.");

            msg = lines.join(" ");
        }
        this.analysisTextEl.textContent = msg;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new MarketSimulation();
});
