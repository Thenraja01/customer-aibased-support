

export const CircuitState = {
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
};

export class LLMCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownMs = options.cooldownMs || 60_000; // 60 seconds
    this.circuits = new Map();
  }

  _getKey(tenantId, provider, model) {
    const org = tenantId ? String(tenantId) : "global";
    const prov = (provider || "unknown").toLowerCase();
    const mdl = (model || "default").toLowerCase();
    return `${org}:${prov}:${mdl}`;
  }

  _getOrCreateCircuit(key) {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        state: CircuitState.CLOSED,
        consecutiveFailures: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        lastFailureTime: null,
        lastFailureReason: null,
        lastSuccessTime: null,
        nextAttemptAllowedAt: 0,
      });
    }
    return this.circuits.get(key);
  }

  /**
   * Checks if a provider/model can be executed for this tenant.
   * Transitions OPEN -> HALF_OPEN if cooldown has elapsed.
   */
  canExecute(tenantId, provider, model) {
    const key = this._getKey(tenantId, provider, model);
    const circuit = this._getOrCreateCircuit(key);

    if (circuit.state === CircuitState.CLOSED) {
      return true;
    }

    if (circuit.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now >= circuit.nextAttemptAllowedAt) {
        circuit.state = CircuitState.HALF_OPEN;
        console.log(`[CircuitBreaker] Circuit for ${key} transitioned from OPEN to HALF_OPEN (probing recovery).`);
        return true;
      }
      return false;
    }

    // HALF_OPEN allows probe
    return true;
  }

  /**
   * Records a successful execution. Closes the circuit and resets failure counters.
   */
  recordSuccess(tenantId, provider, model) {
    const key = this._getKey(tenantId, provider, model);
    const circuit = this._getOrCreateCircuit(key);

    const wasOpen = circuit.state !== CircuitState.CLOSED;
    circuit.state = CircuitState.CLOSED;
    circuit.consecutiveFailures = 0;
    circuit.totalSuccesses += 1;
    circuit.lastSuccessTime = new Date().toISOString();
    circuit.nextAttemptAllowedAt = 0;

    if (wasOpen) {
      console.log(`[CircuitBreaker] Circuit for ${key} recovered. State is now CLOSED.`);
    }
  }

  /**
   * Records a classified failure. Trips the circuit to OPEN if threshold is reached.
   */
  recordFailure(tenantId, provider, model, errorInfo = {}) {
    const key = this._getKey(tenantId, provider, model);
    const circuit = this._getOrCreateCircuit(key);

    circuit.consecutiveFailures += 1;
    circuit.totalFailures += 1;
    circuit.lastFailureTime = new Date().toISOString();
    circuit.lastFailureReason = errorInfo.message || "Unknown error";

    if (circuit.consecutiveFailures >= this.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      circuit.nextAttemptAllowedAt = Date.now() + this.cooldownMs;
      console.warn(
        `[CircuitBreaker] ⚠️ Circuit for ${key} TRIPPED to OPEN (${circuit.consecutiveFailures} consecutive failures). Cooldown: ${this.cooldownMs / 1000}s.`
      );
    }
  }

  /**
   * Retrieves the current circuit status for a specific provider/model.
   */
  getStatus(tenantId, provider, model) {
    const key = this._getKey(tenantId, provider, model);
    const circuit = this._getOrCreateCircuit(key);
    const now = Date.now();
    const remainingCooldownMs =
      circuit.state === CircuitState.OPEN && circuit.nextAttemptAllowedAt > now
        ? circuit.nextAttemptAllowedAt - now
        : 0;

    return {
      key,
      state: circuit.state,
      consecutiveFailures: circuit.consecutiveFailures,
      totalFailures: circuit.totalFailures,
      totalSuccesses: circuit.totalSuccesses,
      lastFailureTime: circuit.lastFailureTime,
      lastFailureReason: circuit.lastFailureReason,
      lastSuccessTime: circuit.lastSuccessTime,
      remainingCooldownMs,
      isAvailable: circuit.state !== CircuitState.OPEN || remainingCooldownMs === 0,
    };
  }

  /**
   * Returns all circuit states for a tenant.
   */
  getAllStatusesForTenant(tenantId) {
    const orgPrefix = tenantId ? `${String(tenantId)}:` : "global:";
    const results = [];
    for (const [key, val] of this.circuits.entries()) {
      if (key.startsWith(orgPrefix) || key.startsWith("global:")) {
        const parts = key.split(":");
        results.push(this.getStatus(parts[0], parts[1], parts[2]));
      }
    }
    return results;
  }

  /**
   * Explicitly resets a circuit to CLOSED (e.g. via Admin Test Connection).
   */
  reset(tenantId, provider, model) {
    const key = this._getKey(tenantId, provider, model);
    const circuit = this._getOrCreateCircuit(key);
    circuit.state = CircuitState.CLOSED;
    circuit.consecutiveFailures = 0;
    circuit.nextAttemptAllowedAt = 0;
    console.log(`[CircuitBreaker] Circuit for ${key} manually reset to CLOSED.`);
  }
}

export const globalCircuitBreaker = new LLMCircuitBreaker({
  failureThreshold: 3,
  cooldownMs: 60_000,
});
