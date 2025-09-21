/**
 * Horde Component
 * Swarm of agents visible as motes with trails and chorus mode
 */
class Horde {
    constructor(canvasId, haptics) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.haptics = haptics;
        
        this.setupCanvas();
        
        // Swarm properties
        this.agents = [];
        this.numAgents = 50;
        this.trails = [];
        this.maxTrailLength = 30;
        
        // Chorus mode
        this.chorusMode = false;
        this.chorusTargets = [];
        this.chorusActivity = 0;
        
        // Animation
        this.animationId = null;
        this.lastTime = 0;
        
        this.initializeSwarm();
        this.startAnimation();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        window.addEventListener('resize', () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        });
    }

    initializeSwarm() {
        const rect = this.canvas.getBoundingClientRect();
        this.agents = [];
        
        for (let i = 0; i < this.numAgents; i++) {
            this.agents.push({
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                energy: Math.random(),
                trailHistory: [],
                lastPress: 0,
                pressTarget: null
            });
        }
    }

    startAnimation() {
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    update(deltaTime) {
        const rect = this.canvas.getBoundingClientRect();
        const dt = deltaTime * 0.001; // Convert to seconds
        
        this.agents.forEach(agent => {
            this.updateAgent(agent, dt, rect);
        });
        
        // Update chorus activity
        if (this.chorusMode) {
            this.updateChorusMode(dt);
        }
        
        // Randomly trigger agent activity
        if (Math.random() < 0.01) {
            this.triggerRandomActivity();
        }
    }

    updateAgent(agent, dt, rect) {
        // Flocking behavior
        const neighbors = this.getNeighbors(agent, 50);
        const separation = this.getSeparation(agent, neighbors);
        const alignment = this.getAlignment(agent, neighbors);
        const cohesion = this.getCohesion(agent, neighbors);
        
        // Apply forces
        agent.vx += (separation.x * 2 + alignment.x * 1 + cohesion.x * 1) * dt;
        agent.vy += (separation.y * 2 + alignment.y * 1 + cohesion.y * 1) * dt;
        
        // Add some randomness
        agent.vx += (Math.random() - 0.5) * 0.5 * dt;
        agent.vy += (Math.random() - 0.5) * 0.5 * dt;
        
        // Limit velocity
        const maxSpeed = 50;
        const speed = Math.sqrt(agent.vx ** 2 + agent.vy ** 2);
        if (speed > maxSpeed) {
            agent.vx = (agent.vx / speed) * maxSpeed;
            agent.vy = (agent.vy / speed) * maxSpeed;
        }
        
        // Update position
        agent.x += agent.vx * dt;
        agent.y += agent.vy * dt;
        
        // Wrap around edges
        if (agent.x < 0) agent.x = rect.width;
        if (agent.x > rect.width) agent.x = 0;
        if (agent.y < 0) agent.y = rect.height;
        if (agent.y > rect.height) agent.y = 0;
        
        // Update trail
        agent.trailHistory.push({ x: agent.x, y: agent.y, time: Date.now() });
        if (agent.trailHistory.length > this.maxTrailLength) {
            agent.trailHistory.shift();
        }
        
        // Update energy
        agent.energy += (Math.random() - 0.5) * 0.01;
        agent.energy = Math.max(0, Math.min(1, agent.energy));
        
        // Check for press activity
        if (Date.now() - agent.lastPress > 2000 + Math.random() * 3000) {
            if (Math.random() < 0.005) {
                this.triggerAgentPress(agent);
            }
        }
    }

    getNeighbors(agent, radius) {
        return this.agents.filter(other => {
            if (other === agent) return false;
            const dx = other.x - agent.x;
            const dy = other.y - agent.y;
            return Math.sqrt(dx ** 2 + dy ** 2) < radius;
        });
    }

    getSeparation(agent, neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0 };
        
        let totalX = 0, totalY = 0;
        neighbors.forEach(neighbor => {
            const dx = agent.x - neighbor.x;
            const dy = agent.y - neighbor.y;
            const distance = Math.sqrt(dx ** 2 + dy ** 2);
            if (distance > 0) {
                totalX += dx / distance;
                totalY += dy / distance;
            }
        });
        
        return {
            x: totalX / neighbors.length,
            y: totalY / neighbors.length
        };
    }

    getAlignment(agent, neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0 };
        
        let totalVx = 0, totalVy = 0;
        neighbors.forEach(neighbor => {
            totalVx += neighbor.vx;
            totalVy += neighbor.vy;
        });
        
        return {
            x: totalVx / neighbors.length - agent.vx,
            y: totalVy / neighbors.length - agent.vy
        };
    }

    getCohesion(agent, neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0 };
        
        let totalX = 0, totalY = 0;
        neighbors.forEach(neighbor => {
            totalX += neighbor.x;
            totalY += neighbor.y;
        });
        
        const centerX = totalX / neighbors.length;
        const centerY = totalY / neighbors.length;
        
        return {
            x: (centerX - agent.x) * 0.1,
            y: (centerY - agent.y) * 0.1
        };
    }

    triggerAgentPress(agent) {
        agent.lastPress = Date.now();
        agent.pressTarget = {
            x: agent.x,
            y: agent.y,
            intensity: agent.energy,
            startTime: Date.now()
        };
        
        // Subtle haptic feedback for swarm activity
        if (Math.random() < 0.3) {
            this.haptics.swarmActivity();
        }
    }

    triggerRandomActivity() {
        const agent = this.agents[Math.floor(Math.random() * this.agents.length)];
        this.triggerAgentPress(agent);
    }

    updateChorusMode(dt) {
        this.chorusActivity += dt;
        
        // Create synchronized pressing patterns
        if (this.chorusActivity > 1.0) {
            this.chorusActivity = 0;
            
            // Select a group of agents for chorus activity
            const chorusSize = Math.floor(this.numAgents * 0.3);
            const chorusAgents = this.agents
                .sort(() => Math.random() - 0.5)
                .slice(0, chorusSize);
            
            chorusAgents.forEach(agent => {
                setTimeout(() => {
                    this.triggerAgentPress(agent);
                }, Math.random() * 500);
            });
        }
    }

    toggleChorusMode() {
        this.chorusMode = !this.chorusMode;
        this.chorusActivity = 0;
    }

    render() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Draw trails first
        this.renderTrails();
        
        // Draw agents
        this.renderAgents();
        
        // Draw press effects
        this.renderPressEffects();
    }

    renderTrails() {
        this.agents.forEach(agent => {
            if (agent.trailHistory.length < 2) return;
            
            this.ctx.beginPath();
            this.ctx.moveTo(agent.trailHistory[0].x, agent.trailHistory[0].y);
            
            for (let i = 1; i < agent.trailHistory.length; i++) {
                this.ctx.lineTo(agent.trailHistory[i].x, agent.trailHistory[i].y);
            }
            
            const alpha = agent.energy * 0.3;
            this.ctx.strokeStyle = `rgba(100, 100, 100, ${alpha})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
        });
    }

    renderAgents() {
        this.agents.forEach(agent => {
            const ctx = this.ctx;
            
            // Agent glow based on energy
            const alpha = 0.3 + agent.energy * 0.7;
            const size = agent.size * (0.8 + agent.energy * 0.4);
            
            // Inner mote
            ctx.beginPath();
            ctx.arc(agent.x, agent.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
            
            // Outer glow
            const gradient = ctx.createRadialGradient(
                agent.x, agent.y, 0,
                agent.x, agent.y, size * 3
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(agent.x, agent.y, size * 3, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }

    renderPressEffects() {
        const currentTime = Date.now();
        
        this.agents.forEach(agent => {
            if (!agent.pressTarget) return;
            
            const elapsed = currentTime - agent.pressTarget.startTime;
            const duration = 1000; // 1 second
            
            if (elapsed > duration) {
                agent.pressTarget = null;
                return;
            }
            
            const progress = elapsed / duration;
            const alpha = (1 - progress) * agent.pressTarget.intensity;
            const radius = progress * 20;
            
            this.ctx.beginPath();
            this.ctx.arc(agent.pressTarget.x, agent.pressTarget.y, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    // Public methods for external control
    addAgent() {
        const rect = this.canvas.getBoundingClientRect();
        this.agents.push({
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            energy: Math.random(),
            trailHistory: [],
            lastPress: 0,
            pressTarget: null
        });
    }

    removeAgent() {
        if (this.agents.length > 10) {
            this.agents.pop();
        }
    }

    disperseSwarm() {
        this.agents.forEach(agent => {
            agent.vx += (Math.random() - 0.5) * 10;
            agent.vy += (Math.random() - 0.5) * 10;
        });
    }
}

// Export as global
window.Horde = Horde;