/*
 * Cartes Serveur HA — deux cartes indépendantes dans un seul fichier, au style des cartes
 * MyElectricalData new (Carte Enedis Linky New) :
 *
 *   custom:serveur-ha-card       état du serveur : CPU, température, RAM, disque, réseau,
 *                                uptime, alimentation, ventilateur et sauvegardes
 *   custom:serveur-ha-maj-card   Home Assistant : version, mises à jour Core / Supervisor / OS,
 *                                base de données, certificat SSL et applications
 *   custom:serveur-ha-nas-card   NAS Synology : santé des volumes et disques, ressources,
 *                                températures, ventilateur, actions, réseau et onduleur
 *   custom:serveur-ha-proxmox-card  Proxmox VE : nœuds, stockages, VM et conteneurs, avec
 *                                démarrage, arrêt et redémarrage confirmés en deux clics
 *
 * Capteurs détectés automatiquement, ou choisis dans la configuration (voir le README).
 */

(() => {
const CARD_VERSION = "0.4.2";

/* ------------------------------------------------------------- affichage */

const fmt = (n, digits = 1) =>
  n === null || n === undefined
    ? "—"
    : Number(n).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Classe de thème de la carte :
 *  v2   : style MyElectricalData, toujours bleu nuit ;
 *  auto : style MyElectricalData, bleu nuit si Home Assistant est en mode sombre, clair sinon ;
 *  ha   : couleurs du thème Home Assistant (clair ou sombre). */
const themeClass = (theme, hass) => {
  const light = hass?.themes?.darkMode === false;
  if (theme === "ha") return `th-ha${light ? " light" : ""}`;
  if (theme === "auto") return `th-v2${light ? " light" : ""}`;
  return "th-v2";
};

/* ------------------------------------------------------------ carte serveur */

const SRV_DEFAULTS = {
  title: "Serveur",
  subtitle: "Serveur Home Assistant",
  net_max: 100, // Mbit/s, pleine échelle des barres réseau
  cpu_warn: 70, cpu_alert: 90,
  temp_warn: 60, temp_alert: 75,
  ram_warn: 75, ram_alert: 90,
  disk_warn: 75, disk_alert: 90,
  show_info: true, show_resources: true, show_network: true, show_power: true, show_backup: true,
  icon: "", // ex. mdi:raspberry-pi
  icon_color: "", // ex. #E30B5D
  ram_total: null, // MiB : la barre « RAM libre » devient libre / total
  theme: "v2",
};

/**
 * Capteurs reconnus. Pour chacun : intégrations (platform) acceptées, clés de traduction,
 * motifs sur l'entity_id (anglais et français) et éventuellement l'unité ou la classe attendue.
 * La première entité qui correspond est retenue ; `entities:` dans la configuration a priorité.
 */
const SRV_FIELDS = [
  { id: "cpu", p: ["systemmonitor", "glances"], k: ["processor_use", "cpu_use_percent", "cpu_usage"], re: /processor_use|cpu_use|cpu_usage|utilisation_du_processeur|processeur_utilis|cpu_percent/, unit: "%" },
  { id: "temperature", p: ["systemmonitor", "glances", "rpi_power"], k: ["processor_temperature", "temperature"], re: /processor_temperature|cpu_temp|temperature_du_processeur|cpu_thermal|soc_temp/, dc: "temperature" },
  { id: "ram", p: ["systemmonitor", "glances"], k: ["memory_use_percent", "memory_usage"], re: /memory_use_percent|memory_usage|ram_used_percent|utilisation_de_la_memoire|memoire_utilisee_pourcent|memoire_utilisation/, unit: "%", not: /swap/ },
  { id: "ram_free", p: ["systemmonitor", "glances"], k: ["memory_free"], re: /memory_free|ram_free|memoire_libre|memoire_disponible/, not: /swap|percent|pourcent/ },
  { id: "disk", p: ["systemmonitor", "glances"], k: ["disk_use_percent", "disk_usage"], re: /disk_use_percent|disk_usage|utilisation_du_disque|disque_utilis.*pourcent|pourcentage.*disque/, unit: "%" },
  { id: "disk_used", p: ["hassio"], k: ["disk_used"], re: /host_disk_used|disque_utilise/ },
  { id: "disk_total", p: ["hassio"], k: ["disk_total"], re: /host_disk_total|disque_total/ },
  { id: "net_in", p: ["systemmonitor", "glances"], k: ["throughput_network_in", "rx"], re: /throughput_network_in|network_throughput_in|debit_reseau_entrant|debit.*entrant|_rx$/, dc: "data_rate" },
  { id: "net_out", p: ["systemmonitor", "glances"], k: ["throughput_network_out", "tx"], re: /throughput_network_out|network_throughput_out|debit_reseau_sortant|debit.*sortant|_tx$/, dc: "data_rate" },
  { id: "ip", p: ["local_ip", "systemmonitor"], k: ["local_ip", "ipv4_address"], re: /local_ip|ipv4_address|adresse_ipv4/ },
  { id: "ip_ext", strict: true, p: ["dnsip"], k: [], re: /myip|ip_publique|public_ip|external_ip|ipv4$/ },
  { id: "last_boot", p: ["systemmonitor"], k: ["last_boot"], re: /last_boot|dernier_demarrage/, dc: ["timestamp", "uptime"] },
  { id: "ha_start", strict: true, p: ["uptime"], k: [], re: /./, dc: ["timestamp", "uptime"] }, // seule l'intégration compte : le nom est libre (ex. sensor.temps_online) ; classe « uptime » depuis HA 2026
  { id: "power", strict: true, p: ["rpi_power"], k: [], re: /rpi_power|power_status|alimentation/ },
  { id: "backup_state", p: ["backup"], k: ["backup_manager_state"], re: /backup_manager_state|etat_du_gestionnaire/ },
  { id: "backup_event", p: ["backup"], k: ["automatic_backup_event"], re: /^event\.backup_(automatic_backup|sauvegarde_automatique)/ },
  { id: "backup_last", p: ["backup"], k: ["last_successful_automatic_backup"], re: /last_successful_automatic_backup|derniere_sauvegarde_automatique_reussie/ },
  { id: "backup_next", p: ["backup"], k: ["next_scheduled_automatic_backup"], re: /next_scheduled_automatic_backup|prochaine_sauvegarde_automatique/ },
  { id: "drive_size", strict: true, p: ["google_drive"], k: ["backups_size", "total_size_of_backups"], re: /total_size_of_backups|backups_size|taille.*sauvegardes/ },
  { id: "drive_used", strict: true, p: ["google_drive"], k: ["storage_used", "storage_used_in_drive", "used_storage"], re: /used_storage|storage_used|used|utilis/, not: /trash|corbeille|size|taille/ },
  { id: "drive_total", strict: true, p: ["google_drive"], k: ["storage_total"], re: /total/ },
  { id: "drive_count", strict: true, nounit: true, p: ["google_drive"], k: ["backups_count"], re: /backup.*count|nombre.*sauvegardes/ },
];

/** Débit converti en Mbit/s pour la barre, quelle que soit l'unité du capteur. */
const toMbit = (v, unit) => {
  const u = String(unit || "").replace(/\s/g, "");
  const f = { "bit/s": 1e-6, "kbit/s": 1e-3, "Mbit/s": 1, "Gbit/s": 1e3, "B/s": 8e-6, "kB/s": 8e-3, "KB/s": 8e-3, "KiB/s": 8.192e-3, "MB/s": 8, "MiB/s": 8.388608, "GB/s": 8e3, "GiB/s": 8589.934592 }[u];
  return f === undefined ? null : v * f;
};

/** Durée écoulée ou restante, en français. */
const relTime = (iso) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const s = (t - Date.now()) / 1000;
  const a = Math.abs(s);
  const txt = a < 90 ? "moins d'une minute" : a < 3600 ? `${Math.round(a / 60)} min` : a < 86400 ? `${Math.round(a / 3600)} h` : `${Math.round(a / 86400)} j`;
  return s >= 0 ? `dans ${txt}` : `il y a ${txt}`;
};

/** Durée depuis une date, compacte : « 12 j 4 h », « 3 h 05 min ». */
const since = (iso) => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const m = Math.max(0, Math.floor((Date.now() - t) / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mn = m % 60;
  return d ? `${d} j ${h} h` : h ? `${h} h ${String(mn).padStart(2, "0")} min` : `${mn} min`;
};

/** « 22/10 23:40 », raccourci à « 22/10 » dans les tuiles étroites par le CSS. */
const dayMonth = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });

const level = (v, warn, alert) => (v === null ? "" : v >= alert ? "b-alert" : v >= warn ? "b-warn" : "b-ok");

class ServeurHaCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...SRV_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      let holdTimer;
      this.shadowRoot.addEventListener("pointerdown", (ev) => {
        const el = ev.target.closest?.("[data-hold]");
        if (!el) return;
        holdTimer = setTimeout(() => {
          this._held = true;
          this._hass?.callService("fan", "toggle", { entity_id: el.dataset.hold });
        }, 600);
      });
      for (const t of ["pointerup", "pointerleave", "pointercancel"]) this.shadowRoot.addEventListener(t, () => clearTimeout(holdTimer));
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        if (this._held) { this._held = false; return; } // un appui long ne doit pas aussi ouvrir la fiche
        const nav = ev.target.closest?.("[data-nav]");
        if (nav) {
          history.pushState(null, "", nav.dataset.nav);
          window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
          return;
        }
        const el = ev.target.closest?.("[data-entity]");
        if (el?.dataset.entity) {
          const e = new Event("hass-more-info", { bubbles: true, composed: true });
          e.detail = { entityId: el.dataset.entity };
          this.dispatchEvent(e);
        }
      }));
    }
    this._render();
  }

  set hass(hass) {
    if (this._hass?.entities !== hass.entities) this._map = null;
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    // Les durées « il y a… » avancent même sans changement d'état
    clearInterval(this._tick);
    this._tick = setInterval(() => { this._sig = null; this._render(); }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
  }

  getCardSize() {
    return 9;
  }

  /** Associe chaque champ à une entité : configuration, puis clé de traduction, puis nom d'entité. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass;
    const reg = Object.values(hass.entities || {});
    const all = reg.length ? reg : Object.keys(hass.states || {}).map((entity_id) => ({ entity_id }));
    const map = {};
    const used = new Set();
    const fits = (e, f) => {
      const st = hass.states?.[e.entity_id];
      if (!st || used.has(e.entity_id)) return false;
      if (f.unit && st.attributes?.unit_of_measurement !== f.unit) return false;
      if (f.nounit && st.attributes?.unit_of_measurement) return false;
      if (f.dc && ![].concat(f.dc).includes(st.attributes?.device_class)) return false;
      if (f.not && f.not.test(e.entity_id)) return false;
      return true;
    };
    for (const pass of ["key", "platform", "any"]) {
      for (const f of SRV_FIELDS) {
        if (map[f.id]) continue;
        const e = all.find((x) => {
          if (!fits(x, f)) return false;
          const inPlatform = x.platform && f.p.includes(x.platform);
          if (pass === "key") return inPlatform && f.k.includes(x.translation_key);
          if (pass === "platform") return inPlatform && f.re.test(x.entity_id);
          // Sans registre (ou intégration non listée) : motif du nom d'entité seul, hors intégrations sans rapport
          // Les champs « strict » ont des noms trop génériques : seulement via leur intégration
          return !f.strict && !x.platform && f.re.test(x.entity_id);
        });
        if (e) { map[f.id] = e.entity_id; used.add(e.entity_id); }
      }
    }
    Object.assign(map, this._config.entities || {});
    // Raccourci de l'éditeur visuel : le ventilateur n'a pas d'intégration standard
    if (this._config.fan) map.fan = this._config.fan;
    // Ventilateur : une entité fan.* (ex. fan.rpi_cooling_fan) si aucun n'est configuré
    if (!map.fan) map.fan = Object.keys(hass.states || {}).find((id) => id.startsWith("fan.") && /rpi|raspberry|cooling|ventil|cpu_fan|refroid/.test(id));
    // IP externe : capteur dédié, sinon attribut d'un routeur ou d'une box (wan_ipaddress, external_ip…)
    if (this._config.ip_ext_attribute) {
      map.ip_ext_attr = this._config.ip_ext_attribute;
    } else if (!map.ip_ext) {
      const hit = Object.values(hass.states || {}).find((st) => ["wan_ipaddress", "external_ip", "wan_ip", "public_ip"].some((a) => st.attributes?.[a]));
      if (hit) {
        map.ip_ext = hit.entity_id;
        map.ip_ext_attr = ["wan_ipaddress", "external_ip", "wan_ip", "public_ip"].find((a) => hit.attributes[a]);
      }
    }
    this._map = map;
    return map;
  }

  _st(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  _num(id) {
    const s = this._st(id);
    if (!s || s.state === "" || s.state === "unknown" || s.state === "unavailable") return null;
    const n = Number(s.state);
    return Number.isFinite(n) ? n : null;
  }

  _txt(id) {
    const s = this._st(id)?.state;
    return s && s !== "unknown" && s !== "unavailable" ? s : null;
  }

  _unit(id, d = "") {
    return this._st(id)?.attributes?.unit_of_measurement ?? d;
  }

  /** Historique 24 h de l'alimentation (API history/period de Home Assistant), en 24 tranches d'une heure. */
  async _loadHistory(id) {
    if (!id || !this._hass?.callApi || this._histBusy) return;
    this._histBusy = true;
    const end = Date.now();
    const start = end - 24 * 3600e3;
    try {
      const path = `history/period/${encodeURIComponent(new Date(start).toISOString())}?filter_entity_id=${encodeURIComponent(id)}` +
        `&end_time=${encodeURIComponent(new Date(end).toISOString())}&minimal_response&no_attributes`;
      const payload = await this._hass.callApi("GET", path);
      const rows = Array.isArray(payload?.[0]) ? payload[0] : [];
      const ev = rows
        .map((r) => ({ t: new Date(r.last_changed || r.last_updated).getTime(), s: String(r.state ?? "unknown") }))
        .filter((r) => Number.isFinite(r.t))
        .sort((a, b) => a.t - b.t);
      if (!ev.length || ev[0].t > start) ev.unshift({ t: start, s: "unknown" });
      else ev[0].t = start;
      this._hist = { id, start, end, ev };
    } catch (err) {
      this._hist = { id, error: err?.message || String(err) };
    } finally {
      this._histBusy = false;
      this._histAt = Date.now();
      this._sig = null;
      this._render();
    }
  }

  _timeline(id) {
    if (!this._hist || this._hist.id !== id || Date.now() - (this._histAt || 0) > 5 * 60e3) this._loadHistory(id);
    const h = this._hist?.id === id ? this._hist : null;
    const COL = { off: "var(--med-down)", on: "var(--t-red)" };
    const LBL = { off: "OK", on: "Danger" };
    const fmtD = (ms) => { const mn = Math.round(ms / 60000); return mn >= 60 ? `${Math.floor(mn / 60)} h${mn % 60 ? ` ${mn % 60} min` : ""}` : `${mn} min`; };
    const fmtT = (t) => new Date(t).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const segs = [];
    for (let i = 0; i < 24; i++) {
      if (!h || h.error) {
        segs.push(`<i title="${esc(h?.error ? `Historique indisponible : ${h.error}` : "Chargement de l'historique…")}"></i>`);
        continue;
      }
      const a = h.start + (i * (h.end - h.start)) / 24;
      const b = h.start + ((i + 1) * (h.end - h.start)) / 24;
      // Morceaux d'état dans la tranche
      let cur = "unknown";
      for (const e of h.ev) { if (e.t > a) break; cur = e.s; }
      const pieces = [];
      let from = a;
      for (const e of h.ev.filter((x) => x.t > a && x.t < b)) { pieces.push({ a: from, b: e.t, s: cur }); from = e.t; cur = e.s; }
      pieces.push({ a: from, b, s: cur });
      const merged = pieces.reduce((acc, p) => { const l = acc[acc.length - 1]; if (l && l.s === p.s) l.b = p.b; else acc.push({ ...p }); return acc; }, []);
      const color = (st) => COL[st] || "color-mix(in srgb, var(--med-muted) 35%, transparent)";
      const bg = merged.length === 1 ? color(merged[0].s)
        : `linear-gradient(90deg, ${merged.map((p) => `${color(p.s)} ${((p.a - a) / (b - a)) * 100}%, ${color(p.s)} ${((p.b - a) / (b - a)) * 100}%`).join(", ")})`;
      const dur = new Map();
      for (const p of merged) dur.set(p.s, (dur.get(p.s) || 0) + (p.b - p.a));
      const tip = `${fmtT(a)} → ${fmtT(b)} · ${[...dur].map(([st, d]) => `${LBL[st] || "Inconnu"} : ${fmtD(d)}`).join(" · ")}`;
      segs.push(`<i style="background:${bg}" title="${esc(tip)}"></i>`);
    }
    return `<div class="srv-tl" aria-label="Historique de l'alimentation sur 24 heures">${segs.join("")}</div>`;
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    const ids = Object.entries(m).filter(([k]) => k !== "ip_ext_attr").map(([, v]) => v);
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${this._histAt || 0}|` + ids.map((id) => this._st(id)?.state ?? "-").join("|") + `|${this._st(m.fan)?.attributes?.percentage}|${this._st(m.backup_event)?.attributes?.event_type}`;
    if (sig === this._sig) return;
    this._sig = sig;

    // --- valeurs
    const cpu = this._num(m.cpu);
    const temp = this._num(m.temperature);
    const tempUnit = this._unit(m.temperature, "°C");
    let ram = this._num(m.ram);
    const ramFree = this._num(m.ram_free);
    let disk = this._num(m.disk);
    const dUsed = this._num(m.disk_used);
    const dTotal = this._num(m.disk_total);
    if (disk === null && dUsed !== null && dTotal) disk = (dUsed / dTotal) * 100;
    const netIn = this._num(m.net_in);
    const netOut = this._num(m.net_out);
    const ip = this._txt(m.ip);
    const ipExt = m.ip_ext_attr ? this._st(m.ip_ext)?.attributes?.[m.ip_ext_attr] || null : this._txt(m.ip_ext);
    const boot = this._txt(m.last_boot);
    const haStart = this._txt(m.ha_start);
    const fanSt = this._st(m.fan);
    const fanIsEntity = m.fan?.startsWith("fan.");
    const fan = fanIsEntity ? (fanSt?.attributes?.percentage ?? null) : this._num(m.fan);
    const fanUnit = fanIsEntity ? "%" : this._unit(m.fan, "");
    const fanOn = fanIsEntity ? (fanSt?.state === "on" ? true : fanSt?.state === "off" ? false : null) : fan === null ? null : fan > 0;
    const powerSt = this._st(m.power);
    // rpi_power : binary_sensor de classe « problem » (on = sous-tension détectée)
    const powerOk = powerSt ? (m.power.startsWith("binary_sensor.") ? powerSt.state === "off" : !/under|sous|low|faible|problem/i.test(powerSt.state)) : null;
    const bState = this._txt(m.backup_state);
    const bLast = this._txt(m.backup_last);
    const bNext = this._txt(m.backup_next);
    const bAge = bLast ? (Date.now() - new Date(bLast).getTime()) / 86400000 : null;
    // Événement de sauvegarde automatique : completed / failed / in_progress
    const bEvent = this._st(m.backup_event)?.attributes?.event_type || null;
    const bOk = bEvent === "failed" ? false : bEvent === "completed" ? (bAge === null || bAge < 2)
      : bState === null && bLast === null ? null : bState && /fail|error|échec|erreur/i.test(bState) ? false : bAge !== null ? bAge < 2 : true;
    const drUsed = this._num(m.drive_used);
    const drTotal = this._num(m.drive_total);
    const drCount = this._num(m.drive_count);
    const drSize = this._num(m.drive_size);

    // --- en-tête
    const head = [ip, temp !== null ? `CPU ${fmt(temp, 1)} ${esc(tempUnit)}` : null].filter(Boolean).join(" · ");
    const dot = (ok, label, id) => (ok === null && !id ? "" : `<span class="srv-led ${ok === null ? "na" : ok ? "ok" : "bad"}" data-entity="${esc(id || "")}"><i></i>${label}</span>`);
    const fanOk = m.fan ? fanOn : null;
    const leds = [dot(powerOk, "Alimentation", m.power), dot(fanOk, "Ventilateur", m.fan), dot(bOk, "Backup", m.backup_event || m.backup_last || m.backup_state)].join("");

    // --- sections
    const sec = (icon, title, body) => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${icon}"></ha-icon>${title}</div>${body}</div>` : "");
    const kv = (rows) => rows.filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => `<div class="srv-kv"><span>${k}</span><b>${esc(v)}</b></div>`).join("");

    const infoTiles = [
      ip || ipExt ? `<div class="tile srv-t" data-entity="${esc(m.ip || m.ip_ext)}"><div class="tile-l"><ha-icon icon="mdi:ip-network-outline"></ha-icon>Adresses IP</div>${kv([["Interne", ip ?? "—"], ["Externe", ipExt ?? (m.ip_ext ? "indisponible" : null)]])}</div>` : "",
      boot || haStart ? `<div class="tile srv-t" data-entity="${esc(m.last_boot || m.ha_start)}"><div class="tile-l"><ha-icon icon="mdi:timer-outline"></ha-icon>Uptime</div>${kv([["Reboot", boot ? since(boot) : null], ["Restart", haStart ? since(haStart) : null]])}</div>` : "",
      m.fan ? `<div class="tile srv-t srv-fan ${fanOn === true ? "on" : fanOn === false ? "off" : ""}" data-entity="${esc(m.fan)}"${fanIsEntity ? ` data-hold="${esc(m.fan)}" title="Appui long : marche / arrêt"` : ""}>
        <div class="tile-l"><ha-icon icon="mdi:fan"></ha-icon>Ventilateur</div>
        <div class="tile-v">${fanOn === null && fan === null ? "—" : fanOn === false ? "Éteint" : fan !== null ? `${fmt(fan, 0)}<span>${esc(fanUnit)}</span>` : "Allumé"}</div>
        <div class="tile-n">${fanOn === null ? "indisponible" : fanOn ? (fanIsEntity ? "allumé" : "en marche") : "à l'arrêt"}</div></div>` : "",
    ].filter(Boolean);

    const gauge = (id, icon, label, v, unit, lvl, pct, sub, wide) => (v === null ? "" : `<div class="srv-g${wide ? " srv-wide" : ""}" data-entity="${esc(id)}">
        <div class="srv-gt"><span><ha-icon icon="${icon}"></ha-icon>${label}</span><b>${v}<small>${unit}</small></b></div>
        <div class="g-bar ${lvl}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>${sub ? `<div class="srv-gs">${sub}</div>` : ""}</div>`);
    const tempPct = temp === null ? 0 : (temp / Math.max(c.temp_alert + 10, 1)) * 100;
    const ramFreeUnit = this._unit(m.ram_free, "MiB");
    const gauges = [
      gauge(m.cpu, "mdi:cpu-64-bit", "CPU", cpu !== null ? fmt(cpu, 0) : null, " %", level(cpu, c.cpu_warn, c.cpu_alert), cpu),
      gauge(m.temperature, "mdi:thermometer", "Température", temp !== null ? fmt(temp, 1) : null, ` ${esc(tempUnit)}`, level(temp, c.temp_warn, c.temp_alert), tempPct),
      gauge(m.ram, "mdi:memory", "RAM", ram !== null ? fmt(ram, 0) : null, " %", level(ram, c.ram_warn, c.ram_alert), ram),
      ramFree !== null ? gauge(m.ram_free, "mdi:memory-arrow-down", "RAM libre", fmt(ramFree, ramFree < 10 ? 1 : 0), ` ${esc(ramFreeUnit)}`, "srv-free",
        c.ram_total ? (ramFree / Number(c.ram_total)) * 100 : ram !== null ? 100 - ram : 0, c.ram_total ? `sur ${fmt(Number(c.ram_total), 0)} ${esc(ramFreeUnit)}` : "") : "",
      gauge(m.disk || m.disk_used, "mdi:harddisk", "Disque", disk !== null ? fmt(disk, 1) : null, " %", level(disk, c.disk_warn, c.disk_alert), disk,
        dUsed !== null && dTotal !== null ? `${fmt(dUsed, 1)} / ${fmt(dTotal, 1)} ${esc(this._unit(m.disk_total, "GB"))}` : "", true),
    ].filter(Boolean);

    const netMax = Number(c.net_max) || 100;
    const net = (id, icon, label, v, cls) => {
      if (!id) return "";
      const unit = this._unit(id, "");
      const mb = v === null ? null : toMbit(v, unit);
      return `<div class="srv-g ${cls}" data-entity="${esc(id)}">
        <div class="srv-gt"><span><ha-icon icon="${icon}"></ha-icon>${label}</span><b>${v !== null ? fmt(v, v < 10 ? 2 : 1) : "—"}<small> ${esc(unit)}</small></b></div>
        <div class="g-bar"><i style="width:${mb === null ? 0 : Math.min(100, (mb / netMax) * 100)}%"></i></div></div>`;
    };
    const nets = [net(m.net_in, "mdi:download", "Download", netIn, "srv-in"), net(m.net_out, "mdi:upload", "Upload", netOut, "srv-out")].filter(Boolean);

    const power = m.power
      ? `<div class="srv-state srv-pw ${powerOk === null ? "" : powerOk ? "ok" : "bad"}" data-entity="${esc(m.power)}">
          <div class="srv-pwh"><ha-icon icon="${powerOk === false ? "mdi:flash-alert" : c.icon || "mdi:power-plug-outline"}"></ha-icon><span>${powerOk === false ? "Sous-tension détectée : vérifiez l'alimentation" : "État de l'alimentation sur 24 h"}</span><b>${powerOk === null ? "—" : powerOk ? "OK" : "Danger"}</b></div>
          ${this._timeline(m.power)}</div>`
      : "";

    const bTile = (id, icon, label, v, n, cls = "") => (v === null ? "" : `<div class="tile srv-b ${cls}" data-entity="${esc(id || "")}"><ha-icon icon="${icon}"></ha-icon><div class="tile-l">${label}</div><div class="srv-bv">${esc(v)}</div>${n ? `<div class="tile-n">${esc(n)}</div>` : ""}</div>`);
    const stateFr = bState ? ({ idle: "Inactif", create_backup: "Sauvegarde…", receive_backup: "Réception…", restore_backup: "Restauration…", blocked: "Bloqué" }[bState] || bState) : null;
    const backups = [
      bTile(m.drive_size || m.drive_count, "mdi:folder-google-drive", "Sauvegardes", drSize !== null ? `${fmt(drSize, drSize < 10 ? 1 : 0)} ${this._unit(m.drive_size, "")}` : drCount !== null ? fmt(drCount, 0) : null, drSize !== null && drCount !== null ? `${fmt(drCount, 0)} fichiers` : ""),
      bEvent ? bTile(m.backup_event, "mdi:cloud-sync-outline", "État", { completed: "Terminé", failed: "Échoué", in_progress: "En cours", started: "En cours" }[bEvent] || bEvent, "", bEvent === "failed" ? "bad" : bEvent === "completed" ? "good" : "") :
      bTile(m.backup_state, "mdi:cloud-check-outline", "État", stateFr, /fail|error|échec|erreur/i.test(bState || "") ? "en erreur" : "", /fail|error|échec|erreur/i.test(bState || "") ? "warn" : ""),
      bTile(m.drive_used, "mdi:google-drive", "Utilisé", drUsed !== null ? `${fmt(drUsed, drUsed < 10 ? 1 : 0)} ${this._unit(m.drive_used, "")}` : null, drTotal !== null ? `sur ${fmt(drTotal, 0)} ${this._unit(m.drive_total, "")}` : ""),
      bTile(m.backup_last, "mdi:history", "Dernière", bLast ? dayMonth(bLast) : null, bLast ? relTime(bLast) : "", bAge !== null && bAge >= 2 ? "warn" : "last"),
      bTile(m.backup_next, "mdi:calendar-clock", "Prochaine", bNext ? dayMonth(bNext) : null, bNext ? relTime(bNext) : "", "next"),
    ].filter(Boolean);

    const empty = !infoTiles.length && !gauges.length && !nets.length && !power && !backups.length;
    const body = empty
      ? `<div class="empty">Aucun capteur trouvé<span>Ajoutez l'intégration System Monitor (Paramètres → Appareils et services) ou indiquez vos capteurs dans <code>entities:</code> (voir le README).</span></div>`
      : [
        c.show_info !== false ? sec("mdi:information-outline", "Informations", infoTiles.length ? `<div class="tiles srv-tiles">${infoTiles.join("")}</div>` : "") : "",
        c.show_resources !== false ? sec("mdi:speedometer", "Ressources", gauges.length ? `<div class="srv-grid">${gauges.join("")}</div>` : "") : "",
        c.show_network !== false ? sec("mdi:swap-vertical", "Débits réseau", nets.length ? `<div class="srv-grid">${nets.join("")}</div>` : "") : "",
        c.show_power !== false ? sec("mdi:power-plug-outline", "Alimentation", power) : "",
        c.show_backup !== false ? sec(m.drive_used || m.drive_size ? "mdi:google-drive" : "mdi:cloud-upload-outline", c.backup_title || (m.drive_used || m.drive_size ? "Google Drive Backup" : "Sauvegardes"), backups.length ? `<div class="srv-bk">${backups.join("")}</div>` : "") : "",
      ].join("");

    const alertCls = powerOk === false || (temp !== null && temp >= c.temp_alert) ? "srv-alert" : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}<ha-card class="${themeClass(c.theme, this._hass)} ${alertCls}">
      <header>
        <div class="brand"${c.navigation_path ? ` data-nav="${esc(c.navigation_path)}" style="cursor:pointer"` : m.ip ? ` data-entity="${esc(m.ip)}" style="cursor:pointer"` : ""}>
          ${c.icon ? `<ha-icon class="srv-icon" icon="${esc(c.icon)}" style="color:${esc(c.icon_color || "var(--med-green)")}"></ha-icon>` : `<svg viewBox="0 0 32 32" aria-hidden="true"><rect class="srv-box" x="5" y="5" width="22" height="22" rx="4"/><path class="bolt" d="M17.5 9 11 18h4.5l-1.5 8 7-10h-4.6z"/></svg>`}
          <div><div class="title">${esc(c.title)}</div>${c.subtitle ? `<div class="sub">${esc(c.subtitle)}</div>` : ""}${head ? `<div class="sub srv-head">${esc(head)}</div>` : ""}</div>
        </div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>${body}</ha-card>`;
  }
}

const SRV_STYLE = `<style>
ha-card { display: block; padding-bottom: 12px; }
ha-card.srv-alert { border-color: var(--t-red); }
.brand .srv-box { fill: none; stroke: var(--med-green); stroke-width: 2.4; }
.srv-head { margin-top: 2px; font-variant-numeric: tabular-nums; }
.srv-leds { display: flex; flex-wrap: wrap; gap: 6px; }
.srv-led { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: .74rem;
  background: var(--med-surface); border: 1px solid var(--med-line); cursor: pointer; }
.srv-led i { width: 8px; height: 8px; border-radius: 50%; background: var(--med-muted); }
.srv-led.ok i { background: var(--med-down); } .srv-led.bad i { background: var(--t-red); } .srv-led.bad { border-color: var(--t-red); }
.srv-sec { margin: 12px 12px 0; }
.srv-h { display: flex; align-items: center; gap: 6px; font-size: .86rem; font-weight: 600; margin: 0 2px 8px; }
.srv-h ha-icon { --mdc-icon-size: 18px; color: var(--med-blue); }
.srv-tiles { margin: 0 !important; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)) !important; }
.srv-t { cursor: pointer; }
.srv-t .tile-l { display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--med-text); margin-bottom: 4px; }
.srv-t .tile-l ha-icon, .srv-b ha-icon { --mdc-icon-size: 18px; color: var(--med-blue); }
.srv-t .tile-v { font-size: 1.2rem; }
.srv-kv { display: flex; justify-content: space-between; gap: 8px; font-size: .78rem; color: var(--med-muted); }
.srv-kv b { color: var(--med-text); font-weight: 600; text-align: right; }
.srv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
.srv-g { padding: 10px 12px; border-radius: 12px; border: 1px solid var(--med-line); background: var(--med-surface); cursor: pointer; }
.srv-gt { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: .82rem; }
.srv-gt span { display: inline-flex; align-items: center; gap: 6px; color: var(--med-muted); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.srv-gt ha-icon { --mdc-icon-size: 18px; color: var(--med-muted); }
.srv-gt b { font-size: 1.15rem; white-space: nowrap; flex: none; }
.srv-gt small { font-size: .74rem; font-weight: 500; color: var(--med-muted); }
.g-bar { position: relative; height: 8px; border-radius: 6px; background: var(--med-line); margin: 8px 0 2px; overflow: hidden; }
.g-bar i { display: block; height: 100%; border-radius: 6px; background: var(--med-blue); }
.g-bar.b-ok i { background: linear-gradient(90deg, var(--med-blue), var(--med-green)); }
.g-bar.b-warn i { background: #f0a33a; } .g-bar.b-alert i { background: var(--t-red); }
.srv-in .g-bar i { background: var(--med-down); } .srv-out .g-bar i { background: var(--med-up); }
.srv-wide { grid-column: 1 / -1; }
.srv-gs { font-size: .72rem; color: var(--med-muted); margin-top: 4px; }
.srv-state { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--med-line); font-size: .84rem; cursor: pointer; }
.srv-state span { flex: 1; } .srv-state ha-icon { --mdc-icon-size: 20px; color: var(--med-muted); }
.srv-state.ok { background: color-mix(in srgb, var(--med-down) 12%, transparent); border-color: color-mix(in srgb, var(--med-down) 55%, transparent); }
.srv-state.ok b, .srv-state.ok ha-icon { color: var(--med-down); }
.srv-state.bad { background: color-mix(in srgb, var(--t-red) 16%, transparent); border-color: var(--t-red); }
.srv-state.bad b, .srv-state.bad ha-icon { color: var(--t-red); }
.srv-bk { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 6px; }
.srv-b { cursor: pointer; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 8px; }
.srv-b .tile-l { font-size: .74rem; }
.srv-bv { font-weight: 700; font-size: .95rem; white-space: nowrap; }
.srv-b .tile-n { white-space: nowrap; font-size: .68rem; }
.srv-b.warn { border-color: #f0a33a; } .srv-b.warn .srv-bv { color: #f0a33a; }
.srv-icon { --mdc-icon-size: 34px; width: 34px; height: 34px; }
.srv-fan.on { border-color: color-mix(in srgb, var(--med-down) 45%, transparent); background: color-mix(in srgb, var(--med-down) 10%, transparent); }
.srv-fan.on .tile-l ha-icon { color: var(--med-down); animation: srv-spin 2.5s linear infinite; }
.srv-fan.off { border-color: color-mix(in srgb, var(--t-red) 35%, transparent); }
.srv-fan.off .tile-l ha-icon, .srv-fan.off .tile-v { color: var(--t-red); }
@keyframes srv-spin { to { transform: rotate(360deg); } }
.g-bar.srv-free i { background: #1f6feb; }
.srv-pw { flex-direction: column; align-items: stretch; gap: 8px; }
.srv-pwh { display: flex; align-items: center; gap: 10px; }
.srv-pwh span { flex: 1; }
.srv-tl { display: flex; gap: 2px; height: 11px; }
.srv-tl i { flex: 1 1 0; min-width: 2px; border-radius: 2px; background: color-mix(in srgb, var(--med-muted) 35%, transparent); cursor: help; }
.srv-b.good { border-color: color-mix(in srgb, var(--med-down) 45%, transparent); } .srv-b.good .srv-bv, .srv-b.good ha-icon { color: var(--med-down); }
.srv-b.last { border-color: color-mix(in srgb, var(--med-down) 40%, transparent); } .srv-b.last ha-icon, .srv-b.last .srv-bv { color: var(--med-down); }
.srv-b.next { border-color: color-mix(in srgb, #f0a33a 40%, transparent); } .srv-b.next ha-icon, .srv-b.next .srv-bv { color: #f0a33a; }
.srv-b.bad { border-color: var(--t-red); } .srv-b.bad .srv-bv, .srv-b.bad ha-icon { color: var(--t-red); }
@media (prefers-reduced-motion: reduce) { .srv-fan.on .tile-l ha-icon { animation: none; } }
code { font-size: .78rem; }
</style>`;

/* ------------------------------------------------- carte Home Assistant (mises à jour) */

const MAJ_DEFAULTS = {
  title: "Home Assistant",
  subtitle: "Serveur domotique",
  ssl_warn: 30, // jours : en dessous, orange
  ssl_alert: 20, // jours : en dessous, rouge
  include_hacs: false, // ajouter les mises à jour HACS aux applications
  include_devices: false, // ajouter les firmwares d'appareils (Zigbee, ESPHome…)
  updates_first: true,
  show_system: true, show_info: true, show_apps: true,
  theme: "v2",
};

const MAJ_SYSTEM = [
  { id: "core", label: "HA Core", re: /home_assistant_core_update$/ },
  { id: "supervisor", label: "Supervisor", re: /home_assistant_supervisor_update$/ },
  { id: "os", label: "HA OS", re: /home_assistant_operating_system_update$/ },
];

/** Nom court d'une application, sans « Mise à jour » / « Update » ni le préfixe de l'appareil. */
const appName = (s) => String(s?.attributes?.title || s?.attributes?.friendly_name || s?.entity_id || "")
  .replace(/\s*[-–]?\s*(mise à jour|update|firmware)$/i, "")
  .replace(/^update\./, "")
  .trim();

const daysUntil = (iso) => {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? Math.ceil((t - Date.now()) / 86400000) : null;
};

class ServeurHaMajCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-maj-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...MAJ_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const el = ev.target.closest?.("[data-entity]");
        if (el?.dataset.entity) {
          const e = new Event("hass-more-info", { bubbles: true, composed: true });
          e.detail = { entityId: el.dataset.entity };
          this.dispatchEvent(e);
        }
      }));
    }
    this._render();
  }

  set hass(hass) {
    if (this._hass?.entities !== hass.entities) this._map = null;
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 7;
  }

  _st(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  /** Trouve les entités : système, base de données, certificat SSL et applications. */
  _resolve() {
    if (this._map) return this._map;
    const c = this._config;
    const hass = this._hass;
    const reg = hass.entities || {};
    const ids = Object.keys(hass.states || {});
    const plat = (id) => reg[id]?.platform;
    const map = { system: {} };
    for (const s of MAJ_SYSTEM) map.system[s.id] = (c.entities || {})[s.id] || ids.find((id) => id.startsWith("update.") && s.re.test(id)) || null;
    const sys = new Set(Object.values(map.system));
    map.database = c.database || ids.find((id) => id.startsWith("sensor.") && /home_assistant_v2_db_size|_db_size$|database_size|taille_de_la_base/.test(id)) || null;
    map.ssl = c.ssl || ids.find((id) => id.startsWith("sensor.") && (plat(id) === "cert_expiry" || /expiration_du_certificat|cert_expiry|certificate_expiry/.test(id))) || null;
    if (Array.isArray(c.apps)) {
      map.apps = c.apps.map((a) => (typeof a === "string" ? { entity: a } : a)).filter((a) => a.entity);
    } else {
      // Applications : mises à jour des add-ons (intégration Supervisor), HACS et appareils en option
      const exclude = new Set(c.exclude || []);
      map.apps = ids
        .filter((id) => id.startsWith("update.") && !sys.has(id) && !exclude.has(id))
        .filter((id) => {
          const p = plat(id);
          if (p === "hassio") return true;
          if (p === "hacs") return c.include_hacs === true;
          if (p) return c.include_devices === true;
          // Sans registre : on garde ce qui ressemble à un add-on (icône servie par le Supervisor)
          return /\/api\/hassio\/addons\//.test(hass.states[id]?.attributes?.entity_picture || "");
        })
        .map((entity) => ({ entity }));
    }
    this._map = map;
    return map;
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    const watch = [...Object.values(m.system), m.database, m.ssl, ...m.apps.map((a) => a.entity)];
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${new Date().toDateString()}|` +
      watch.map((id) => { const s = this._st(id); return s ? `${s.state}${s.attributes?.installed_version}${s.attributes?.in_progress}` : "-"; }).join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const ver = (s) => s?.attributes?.installed_version || null;
    const latest = (s) => s?.attributes?.latest_version || null;
    const core = this._st(m.system.core);

    // Voyants de l'en-tête : vert = à jour, orange = mise à jour disponible, gris = inconnu
    const led = (label, id) => {
      const s = this._st(id);
      if (!s) return "";
      const cls = s.state === "on" ? "upd" : s.state === "off" ? "ok" : "na";
      return `<span class="srv-led ${cls}" data-entity="${esc(id)}"><i></i>${label}</span>`;
    };
    const leds = MAJ_SYSTEM.map((x) => led(x.label.replace("HA ", ""), m.system[x.id])).join("");

    // Mises à jour système
    const sysTiles = MAJ_SYSTEM.map((x) => {
      const s = this._st(m.system[x.id]);
      if (!s) return "";
      const on = s.state === "on";
      const busy = s.attributes?.in_progress;
      return `<div class="tile maj-sys ${on ? "upd" : ""}" data-entity="${esc(m.system[x.id])}">
        <div class="tile-l">${x.label}</div>
        <div class="maj-v">${esc(ver(s) || "—")}</div>
        <div class="tile-n">${busy ? "installation…" : on ? `→ <b>${esc(latest(s) || "?")}</b> disponible` : "à jour"}</div>
      </div>`;
    }).filter(Boolean);

    // Informations : base de données et certificat SSL
    const info = [];
    const db = this._st(m.database);
    if (db) {
      const n = Number(db.state);
      info.push(`<div class="tile maj-info" data-entity="${esc(m.database)}"><ha-icon icon="mdi:database"></ha-icon><div><div class="tile-l">Base de données</div>
        <div class="maj-iv">${Number.isFinite(n) ? `${fmt(n, n < 10 ? 2 : 1)} ${esc(db.attributes?.unit_of_measurement || "MB")}` : "indisponible"}</div></div></div>`);
    }
    const ssl = this._st(m.ssl);
    if (ssl) {
      const d = daysUntil(ssl.state);
      const cls = d === null ? "" : d >= c.ssl_warn ? "ok" : d >= c.ssl_alert ? "warn" : "bad";
      const date = d === null ? "—" : new Date(ssl.state).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
      info.push(`<div class="tile maj-info ${cls}" data-entity="${esc(m.ssl)}"><ha-icon icon="mdi:certificate"></ha-icon><div><div class="tile-l">Certificat SSL</div>
        <div class="maj-iv">${d === null ? "indisponible" : d < 0 ? "expiré" : `encore ${d} jour${d > 1 ? "s" : ""}`}</div><div class="tile-n">expire le ${date}</div></div></div>`);
    }

    // Applications
    let apps = m.apps.map((a) => ({ ...a, s: this._st(a.entity) })).filter((a) => a.s);
    if (c.updates_first !== false) apps.sort((a, b) => (b.s.state === "on") - (a.s.state === "on") || appName(a.s).localeCompare(appName(b.s), "fr"));
    const nUpd = apps.filter((a) => a.s.state === "on").length;
    const appTiles = apps.map((a) => {
      const on = a.s.state === "on";
      const pic = a.picture || a.s.attributes?.entity_picture;
      const name = a.name || appName(a.s);
      return `<div class="maj-app ${on ? "upd" : ""}" data-entity="${esc(a.entity)}" title="${esc(name)} ${esc(ver(a.s) || "")}${on ? ` → ${esc(latest(a.s) || "")}` : ""}">
        <div class="maj-ico">${pic ? `<img src="${esc(pic)}" alt="" loading="lazy">` : `<ha-icon icon="${esc(a.icon || "mdi:puzzle-outline")}"></ha-icon>`}<span class="maj-badge">${on ? "↑" : "✓"}</span></div>
        <div class="maj-an">${esc(name)}</div>
        <div class="maj-av">${esc(on ? latest(a.s) || "" : ver(a.s) || "")}</div>
      </div>`;
    });

    const sec = (icon, title, right, body) => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${icon}"></ha-icon>${title}${right ? `<span class="maj-r">${right}</span>` : ""}</div>${body}</div>` : "");
    const body = [
      c.show_system !== false ? sec("mdi:update", "Mises à jour système", "", sysTiles.length ? `<div class="maj-grid3">${sysTiles.join("")}</div>` : "") : "",
      c.show_info !== false ? sec("mdi:information-outline", "Informations", "", info.length ? `<div class="maj-grid2">${info.join("")}</div>` : "") : "",
      c.show_apps !== false ? sec("mdi:application-outline", "Applications", apps.length ? (nUpd ? `<b class="maj-cnt">${nUpd} mise${nUpd > 1 ? "s" : ""} à jour</b>` : "tout est à jour") : "", appTiles.length ? `<div class="maj-apps">${appTiles.join("")}</div>` : "") : "",
    ].join("");

    const sub = [c.subtitle, ver(core) ? `Core ${ver(core)}` : null].filter(Boolean).map(esc).join(" · ");
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${MAJ_STYLE}<ha-card class="${themeClass(c.theme, this._hass)}">
      <header>
        <div class="brand" data-entity="${esc(m.system.core || "")}" style="cursor:pointer">
          <svg viewBox="0 0 32 32" aria-hidden="true"><path class="house" d="M4 14.5 16 4l12 10.5V27a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 4 27z"/><circle class="bolt" cx="16" cy="17" r="3"/><path class="house" d="M16 20v6M16 17l-5 4M16 17l5-3"/></svg>
          <div><div class="title">${esc(c.title)}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>
        </div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body || `<div class="empty">Aucune entité trouvée<span>Cette carte lit les entités <code>update.*</code> de Home Assistant (intégration Supervisor). Indiquez-les dans <code>entities:</code> et <code>apps:</code> si besoin (voir le README).</span></div>`}
    </ha-card>`;
  }
}

const MAJ_STYLE = `<style>
.srv-led.upd i { background: #f0a33a; } .srv-led.upd { border-color: #f0a33a; }
.maj-r { margin-left: auto; font-size: .74rem; font-weight: 500; color: var(--med-muted); }
.maj-cnt { color: #f0a33a; font-weight: 700; }
.maj-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.maj-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
@container (max-width: 360px) { .maj-grid3 { grid-template-columns: 1fr; } }
.maj-sys { cursor: pointer; }
.maj-sys .tile-l { font-weight: 600; color: var(--med-text); }
.maj-v { font-size: 1.05rem; font-weight: 700; margin-top: 2px; word-break: break-all; }
.maj-sys .tile-n b { color: #f0a33a; }
.maj-sys.upd { border-color: #f0a33a; background: color-mix(in srgb, #f0a33a 10%, transparent); }
.maj-info { cursor: pointer; display: flex; gap: 10px; align-items: center; }
.maj-info ha-icon { --mdc-icon-size: 26px; color: var(--med-blue); flex: none; }
.maj-info .tile-l { font-weight: 600; color: var(--med-text); }
.maj-iv { font-weight: 700; font-size: .95rem; }
.maj-info.ok ha-icon, .maj-info.ok .maj-iv { color: var(--med-down); }
.maj-info.warn { border-color: #f0a33a; } .maj-info.warn ha-icon, .maj-info.warn .maj-iv { color: #f0a33a; }
.maj-info.bad { border-color: var(--t-red); background: color-mix(in srgb, var(--t-red) 12%, transparent); }
.maj-info.bad ha-icon, .maj-info.bad .maj-iv { color: var(--t-red); }
.maj-apps { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px; }
.maj-app { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 4px; border-radius: 12px;
  border: 1px solid var(--med-line); cursor: pointer; text-align: center; min-width: 0; }
.maj-app:hover { background: var(--med-surface); }
.maj-app.upd { border-color: #f0a33a; background: color-mix(in srgb, #f0a33a 10%, transparent); }
.maj-ico { position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; }
.maj-ico img { width: 38px; height: 38px; object-fit: contain; border-radius: 8px; }
.maj-ico ha-icon { --mdc-icon-size: 30px; color: var(--med-blue); }
.maj-badge { position: absolute; right: -6px; bottom: -4px; width: 16px; height: 16px; border-radius: 50%; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; background: var(--med-down); color: #fff; box-shadow: 0 0 0 2px var(--med-bg); }
.maj-app.upd .maj-badge { background: #f0a33a; }
.maj-an { font-size: .72rem; font-weight: 600; line-height: 1.2; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.maj-av { font-size: .64rem; color: var(--med-muted); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.maj-app.upd .maj-av { color: #f0a33a; font-weight: 600; }
</style>`;

/* ------------------------------------------------------------ carte NAS Synology */

const NAS_DEFAULTS = {
  title: "",
  icon: "mdi:nas",
  icon_color: "",
  volume_name: "", // ex. « HDD 4 To » ; sinon « Volume 1 »
  net_max: 1000, // Mbit/s, pleine échelle des barres réseau
  temp_warn: 45, temp_alert: 55, // °C, disques et NAS
  show_info: true, show_resources: true, show_thermal: true, show_actions: true, show_network: true, show_ups: true,
  theme: "v2",
};

/** Clés de traduction de l'intégration Synology DSM (identiques quelle que soit la langue). */
const NAS_KEYS = {
  cpu: ["cpu_total_load"],
  ram: ["memory_real_usage"],
  temperature: ["temperature"],
  last_boot: ["uptime"],
  net_down: ["network_down"],
  net_up: ["network_up"],
  security: ["status"],
  vol_status: ["volume_status"],
  vol_used: ["volume_percentage_used"],
  drv_status: ["disk_status"],
  drv_smart: ["disk_smart_status"],
  drv_temp: ["disk_temp"],
  drv_bad: ["disk_exceed_bad_sector_thr"],
  drv_life: ["disk_below_remain_life_thr"],
};
/** Repli sur le nom d'entité (anglais / français) quand le registre n'a pas de clé. */
const NAS_RE = {
  cpu: /cpu_utilization_total$|utilisation_totale_du_processeur$/,
  ram: /memory_usage_real$|utilisation_reelle_de_la_memoire$/,
  temperature: /_temperature$/,
  last_boot: /last_boot$|dernier_demarrage$/,
  net_down: /download_throughput$|debit_descendant$/,
  net_up: /upload_throughput$|debit_montant$/,
  security: /security_status$|etat_de_securite$|statut_de_securite$/,
  vol_status: /volume_\d+_(status|statut|etat)$/,
  vol_used: /volume_\d+_(volume_used|utilise|pourcentage_utilise)/,
  drv_status: /(drive|disque)_\d+_(status|statut|etat)$/,
  drv_smart: /(drive|disque)_\d+_(status_smart|statut_smart|etat_smart)$/,
  drv_temp: /(drive|disque)_\d+_temperature$/,
  drv_bad: /(drive|disque)_\d+_(exceeded_max_bad_sectors|secteurs_defectueux)/,
  drv_life: /(drive|disque)_\d+_(below_min_remaining_life|duree_de_vie)/,
};
/** Clés NUT pour la section onduleur (même logique que la Carte Onduleur UPS). */
const NAS_UPS = {
  status: { k: ["ups_status_display"], re: /_status$|_etat$/ },
  status_raw: { k: ["ups_status"], re: /_status_data$|_code_d_etat$/ },
  input: { k: ["input_voltage"], re: /_input_voltage$|_tension_d_entree$/ },
  output: { k: ["output_voltage"], re: /_output_voltage$|_tension_de_sortie$/ },
  load: { k: ["ups_load"], re: /_load$|_charge$/ },
  battery: { k: ["battery_charge"], re: /_battery_charge$|_charge_de_la_batterie$/ },
  runtime: { k: ["battery_runtime"], re: /_battery_runtime$|_autonomie_de_la_batterie$/ },
};

const numIn = (id) => Number((/(?:volume|drive|disque)_(\d+)/.exec(id) || [])[1] || 0);
/** États Synology DSM et NUT en français (l'intégration les renvoie en anglais). */
const NAS_FR = {
  normal: "Normal", degraded: "Dégradé", crashed: "En panne", failing: "Défaillant", warning: "Avertissement", attention: "Attention",
  initialized: "Initialisé", not_initialized: "Non initialisé", system_partition_failed: "Partition système en échec", repairing: "Réparation…",
  online: "Secteur", "on battery": "Sur batterie", "on battery discharging": "Sur batterie", "online charging": "Secteur · en charge",
  "low battery": "Batterie faible", "replace battery": "Batterie à remplacer", overload: "Surcharge",
};
const fr = (s) => (s == null ? s : NAS_FR[String(s).trim().toLowerCase()] || s);

const okWord = (s) => /^(normal|ok|online|en ligne|healthy|sain|bon)$/i.test(String(s || "").trim());

class ServeurHaNasCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-nas-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...NAS_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      let holdTimer;
      this.shadowRoot.addEventListener("pointerdown", (ev) => {
        const el = ev.target.closest?.("[data-hold]");
        if (!el) return;
        holdTimer = setTimeout(() => {
          this._held = true;
          const id = el.dataset.hold;
          const domain = id.split(".")[0];
          if (domain === "select") this._hass?.callService("select", "select_next", { entity_id: id, cycle: true });
          else this._hass?.callService("homeassistant", "toggle", { entity_id: id });
        }, 600);
      });
      for (const t of ["pointerup", "pointerleave", "pointercancel"]) this.shadowRoot.addEventListener(t, () => clearTimeout(holdTimer));
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        if (this._held) { this._held = false; return; }
        const panel = ev.target.closest?.("[data-panel]");
        if (panel) { this._open = !this._open; this._sig = null; this._render(); return; }
        const press = ev.target.closest?.("[data-press]");
        if (press) {
          // Bouton (redémarrage, arrêt, allumage…) : premier clic arme, second clic dans les 5 s confirme
          const id = press.dataset.press;
          if (this._armed === id) {
            this._armed = null;
            const domain = id.split(".")[0];
            if (domain === "button") this._hass?.callService("button", "press", { entity_id: id });
            else if (domain === "script") this._hass?.callService("script", "turn_on", { entity_id: id });
            else this._hass?.callService("homeassistant", "toggle", { entity_id: id });
          } else {
            this._armed = id;
            clearTimeout(this._armTimer);
            this._armTimer = setTimeout(() => { this._armed = null; this._sig = null; this._render(); }, 5000);
          }
          this._sig = null;
          this._render();
          return;
        }
        const nav = ev.target.closest?.("[data-nav]");
        if (nav) {
          history.pushState(null, "", nav.dataset.nav);
          window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
          return;
        }
        const el = ev.target.closest?.("[data-entity]");
        if (el?.dataset.entity) {
          const e = new Event("hass-more-info", { bubbles: true, composed: true });
          e.detail = { entityId: el.dataset.entity };
          this.dispatchEvent(e);
        }
      }));
    }
    this._render();
  }

  set hass(hass) {
    if (this._hass?.entities !== hass.entities) this._map = null;
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    clearInterval(this._tick);
    this._tick = setInterval(() => { this._sig = null; this._render(); }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
  }

  getCardSize() {
    return 10;
  }

  _st(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  _num(id) {
    const s = this._st(id);
    if (!s || s.state === "" || s.state === "unknown" || s.state === "unavailable") return null;
    const n = Number(s.state);
    return Number.isFinite(n) ? n : null;
  }

  _txt(id) {
    const s = this._st(id)?.state;
    return s && s !== "unknown" && s !== "unavailable" ? s : null;
  }

  _unit(id, d = "") {
    return this._st(id)?.attributes?.unit_of_measurement ?? d;
  }

  /** Entités du NAS (intégration Synology DSM), de l'onduleur (NUT) et options de la configuration. */
  _resolve() {
    if (this._map) return this._map;
    const c = this._config;
    const hass = this._hass;
    const reg = hass.entities || {};
    const ids = Object.keys(hass.states || {});
    const regList = Object.values(reg);
    // Appareil DSM : celui choisi, sinon le premier qui porte une entité synology_dsm
    const dsmIds = ids.filter((id) => reg[id]?.platform === "synology_dsm");
    const devices = [...new Set(dsmIds.map((id) => reg[id]?.device_id).filter(Boolean))];
    let pool;
    if (dsmIds.length) {
      // Les entités DSM sont réparties sur plusieurs appareils (NAS, volumes, disques) : on garde
      // celles dont l'entity_id commence comme celles du NAS choisi
      const hub = c.device || devices[0];
      const first = dsmIds.find((id) => reg[id]?.device_id === hub) || dsmIds[0];
      const prefix = c.prefix || first.split(".")[1].split("_")[0];
      pool = dsmIds.filter((id) => id.split(".")[1].startsWith(prefix));
      this._prefix = prefix;
    } else {
      // Sans registre : préfixe donné, ou « diskstation » par défaut
      const prefix = c.prefix || "diskstation";
      pool = ids.filter((id) => id.split(".")[1]?.startsWith(prefix));
      this._prefix = prefix;
    }
    const key = (id) => reg[id]?.translation_key;
    const find = (f, domain = "sensor") => pool.filter((id) => id.startsWith(domain + ".") && (NAS_KEYS[f].includes(key(id)) || (!key(id) && NAS_RE[f].test(id))));
    const one = (f, domain) => (c.entities || {})[f] || find(f, domain)[0] || null;
    const map = {
      cpu: one("cpu"), ram: one("ram"), last_boot: one("last_boot"),
      net_down: one("net_down"), net_up: one("net_up"),
      security: one("security", "binary_sensor"),
      temperature: (c.entities || {}).temperature || find("temperature").find((id) => !NAS_RE.drv_temp.test(id) && !/volume/.test(id)) || null,
    };
    map.volumes = find("vol_status").map((id) => ({ n: numIn(id), status: id, used: find("vol_used").find((u) => numIn(u) === numIn(id)) || null })).sort((a, b) => a.n - b.n);
    const drives = new Map();
    for (const f of ["drv_status", "drv_smart", "drv_temp"]) for (const id of find(f)) { const n = numIn(id); drives.set(n, { ...(drives.get(n) || { n }), [f]: id }); }
    for (const f of ["drv_bad", "drv_life"]) for (const id of find(f, "binary_sensor")) { const n = numIn(id); drives.set(n, { ...(drives.get(n) || { n }), [f]: id }); }
    map.drives = [...drives.values()].sort((a, b) => a.n - b.n);
    map.fan = c.fan || ids.find((id) => id.startsWith("select.") && id.includes(this._prefix) && /fan|ventil/.test(id)) || null;
    // reboot: null dans la configuration masque le bouton ; absent, il est détecté
    map.reboot = Object.prototype.hasOwnProperty.call(c, "reboot") ? c.reboot : (pool.find((id) => id.startsWith("button.") && (key(id) === "reboot" || /_reboot$|_redemarrer$/.test(id))) || null);
    map.tracker = c.tracker || ids.find((id) => id.startsWith("device_tracker.") && id.includes(this._prefix)) || null;
    // Marche / arrêt : bouton « Arrêter » de DSM (shutdown: null le masque) ; allumage par Wake on LAN,
    // prise ou script (power_on), sinon bouton Wake on LAN dont le nom contient celui du NAS
    const has = (k) => Object.prototype.hasOwnProperty.call(c, k);
    map.shutdown = has("shutdown") ? c.shutdown : (pool.find((id) => id.startsWith("button.") && (key(id) === "shutdown" || /_shutdown$|_arreter$|_eteindre$/.test(id))) || null);
    const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const nasName = norm(hass.devices?.[reg[map.cpu]?.device_id]?.name || this._prefix);
    map.power_on = has("power_on") ? c.power_on : (nasName && ids.find((id) => id.startsWith("button.") && reg[id]?.platform === "wake_on_lan"
      && norm(hass.states[id]?.attributes?.friendly_name).includes(nasName))) || null;
    // Mise à jour DSM : entité update de Synology DSM (dsm_update: null la masque)
    map.dsm_update = has("dsm_update") ? c.dsm_update : (pool.find((id) => id.startsWith("update.")) || null);
    // Disques USB : liste donnée (capteurs en %), sinon capteurs DSM en % dont le nom contient « usb »
    map.usb = Array.isArray(c.usb) ? c.usb.map((u) => (typeof u === "string" ? { entity: u } : u))
      : pool.filter((id) => id.startsWith("sensor.") && /usb/.test(id) && hass.states[id]?.attributes?.unit_of_measurement === "%").map((entity) => ({ entity }));
    // IP externe : attribut d'un routeur / d'une box (wan_ipaddress…)
    if (c.ip_ext) map.ip_ext = c.ip_ext;
    else {
      const hit = Object.values(hass.states || {}).find((st) => ["wan_ipaddress", "external_ip", "wan_ip"].some((a) => st.attributes?.[a]));
      if (hit) map.ip_ext = { entity: hit.entity_id, attr: ["wan_ipaddress", "external_ip", "wan_ip"].find((a) => hit.attributes[a]) };
    }
    // Onduleur : appareil NUT choisi, sinon le premier
    map.ups = {};
    if (c.show_ups !== false) {
      const nut = ids.filter((id) => reg[id]?.platform === "nut" && id.startsWith("sensor."));
      const upsDev = c.ups_device || reg[nut[0]]?.device_id;
      const upsPool = nut.filter((id) => !upsDev || reg[id]?.device_id === upsDev);
      const src = upsPool.length ? upsPool : ids.filter((id) => /^sensor\.ups_/.test(id));
      const used = new Set();
      for (const [f, d] of Object.entries(NAS_UPS)) {
        const id = (c.ups || {})[f] || src.find((x) => !used.has(x) && d.k.includes(key(x))) || src.find((x) => !used.has(x) && !key(x) && d.re.test(x));
        if (id) { map.ups[f] = id; used.add(id); }
      }
    }
    map.actions = Array.isArray(c.actions) ? c.actions.map((a) => (typeof a === "string" ? { entity: a } : a)) : [];
    this._map = map;
    return map;
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    const all = [m.cpu, m.ram, m.last_boot, m.net_down, m.net_up, m.security, m.temperature, m.fan, m.reboot, m.tracker, m.shutdown, m.power_on, m.dsm_update,
      /^[a-z_]+\.[a-z0-9_]+$/.test(c.ip || "") ? c.ip : null, ...m.usb.map((u) => u.entity),
      ...m.volumes.flatMap((v) => [v.status, v.used]), ...m.drives.flatMap((d) => Object.values(d)), ...Object.values(m.ups), ...m.actions.map((a) => a.entity),
      typeof m.ip_ext === "object" ? m.ip_ext?.entity : m.ip_ext];
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${this._open}|${this._armed}|` + all.map((id) => (typeof id === "string" ? this._st(id)?.state ?? "-" : "")).join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    // --- en-tête
    const trk = this._st(m.tracker);
    const online = trk ? trk.state === "home" : this._txt(m.cpu) !== null;
    // IP : option ip (adresse ou entité), sinon traceur réseau, sinon adresse de configuration de l'appareil DSM
    const devOf = Object.values(this._hass.devices || {}).find((d) => d.id === this._hass.entities?.[m.cpu]?.device_id);
    const cfgHost = (() => { try { return devOf?.configuration_url ? new URL(devOf.configuration_url).hostname : null; } catch (e) { return null; } })();
    const ipOpt = c.ip ? (/^[a-z_]+\.[a-z0-9_]+$/.test(c.ip) ? this._txt(c.ip) : c.ip) : null;
    const ip = ipOpt || trk?.attributes?.ip || trk?.attributes?.ip_address || cfgHost || null;
    const ipExt = typeof m.ip_ext === "object" ? this._st(m.ip_ext.entity)?.attributes?.[m.ip_ext.attr] : this._txt(m.ip_ext);
    const vol1 = m.volumes[0];
    const vol1State = this._txt(vol1?.status);
    const drivesBad = m.drives.some((d) => this._st(d.drv_bad)?.state === "on" || this._st(d.drv_life)?.state === "on" || (this._txt(d.drv_status) && !okWord(this._txt(d.drv_status))));
    const hddOk = !m.volumes.length && !m.drives.length ? null : m.volumes.every((v) => okWord(this._txt(v.status))) && !drivesBad;
    const secSt = this._st(m.security)?.state;
    const secOk = secSt === undefined ? null : secSt === "off";
    const upsSt = this._txt(m.ups.status);
    const upsRaw = this._txt(m.ups.status_raw);
    const upsOk = !m.ups.status && !m.ups.status_raw ? null : (upsRaw ? /\bOL\b/.test(upsRaw) && !/\b(OB|LB|RB|OVER)\b/.test(upsRaw) : /online|en ligne/i.test(upsSt || ""));
    const led = (ok, label, id) => (ok === null ? "" : `<span class="srv-led ${ok ? "ok" : "bad"}" data-entity="${esc(id || "")}"><i></i>${label}</span>`);
    const leds = [led(online, "NAS", m.tracker || m.cpu), led(hddOk, "HDD", vol1?.status), led(secOk, "Sécurité", m.security), led(upsOk, "UPS", m.ups.status || m.ups.status_raw)].join("");
    const dev = Object.values(this._hass.devices || {}).find((d) => d.id === this._hass.entities?.[m.cpu]?.device_id);
    const title = c.title || dev?.name_by_user || dev?.name || "NAS";
    const sub2 = [ip, vol1State ? `Volume ${fr(vol1State).toLowerCase()}` : null].filter(Boolean).join(" · ");

    const sec = (icon, t, body) => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${icon}"></ha-icon>${t}</div>${body}</div>` : "");
    const kv = (rows) => rows.filter(([, v]) => v !== null && v !== undefined).map(([k, v, cls]) => `<div class="srv-kv"><span>${k}</span><b class="${cls || ""}">${esc(v)}</b></div>`).join("");

    // --- informations
    const boot = this._txt(m.last_boot);
    // DSM : version installée et mise à jour disponible
    const upd = this._st(m.dsm_update);
    const short = (v) => (/\d+(?:\.\d+)+/.exec(v || "") || [v || null])[0]; // « DSM 7.2.2-72806 Update 3 » → « 7.2.2 »
    const inst = upd?.attributes?.installed_version, last = upd?.attributes?.latest_version;
    const dsmTile = upd && upd.state !== "unavailable" ? `<div class="tile srv-t nas-dsm ${upd.state === "on" ? "up" : ""}" data-entity="${esc(m.dsm_update)}" title="${esc([inst, upd.state === "on" ? `→ ${last}` : ""].filter(Boolean).join(" "))}"><div class="tile-l"><ha-icon icon="${upd.state === "on" ? "mdi:package-up" : "mdi:package-check"}"></ha-icon>DSM</div>
        ${kv([["Version", short(inst)], upd.state === "on" ? ["Dispo", short(last) || "Oui", "bad"] : ["État", "À jour", "ok"]])}</div>` : "";
    const info = [
      ip || ipExt ? `<div class="tile srv-t" data-entity="${esc(m.tracker || "")}"><div class="tile-l"><ha-icon icon="mdi:ip-network-outline"></ha-icon>Réseau</div>${kv([["Interne", ip || "—"], ["Externe", ipExt || null]])}</div>` : "",
      m.volumes.length || m.security ? `<div class="tile srv-t nas-health ${hddOk === false || secOk === false ? "bad" : ""}" data-panel="1" title="Afficher l'état des disques">
        <div class="tile-l"><ha-icon icon="${hddOk === false ? "mdi:shield-alert-outline" : "mdi:shield-check-outline"}"></ha-icon>Santé<ha-icon class="nas-chev" icon="mdi:chevron-${this._open ? "up" : "down"}"></ha-icon></div>
        ${kv([["Volume", fr(vol1State), okWord(vol1State) ? "ok" : "bad"], ["Sécurité", secSt === undefined ? null : secOk ? "Sécurisé" : "Alerte", secOk ? "ok" : "bad"]])}</div>` : "",
      boot ? `<div class="tile srv-t" data-entity="${esc(m.last_boot)}"><div class="tile-l"><ha-icon icon="mdi:clock-start"></ha-icon>Uptime</div><div class="nas-up">${esc(since(boot))}</div></div>` : "",
      dsmTile,
    ].filter(Boolean);

    // Panneau « État des disques » (remplace la fenêtre browser_mod du modèle)
    const panel = this._open && m.drives.length
      ? `<div class="nas-panel">${m.drives.map((d) => {
        const flag = (id) => { const s = this._st(id)?.state; return s === undefined ? null : s === "off" ? ["OK", "ok"] : ["Alerte", "bad"]; };
        const bad = flag(d.drv_bad), life = flag(d.drv_life);
        return `<div class="nas-drv" data-entity="${esc(d.drv_status || d.drv_smart || "")}"><div class="nas-drv-h"><ha-icon icon="mdi:harddisk"></ha-icon>Disque ${d.n}</div>
          ${kv([["État", fr(this._txt(d.drv_status)), okWord(this._txt(d.drv_status)) ? "ok" : "bad"], ["SMART", fr(this._txt(d.drv_smart)), okWord(this._txt(d.drv_smart)) ? "ok" : "bad"],
            ["Secteurs défectueux", bad?.[0] ?? null, bad?.[1]], ["Durée de vie", life?.[0] ?? null, life?.[1]],
            ["Température", this._num(d.drv_temp) !== null ? `${fmt(this._num(d.drv_temp), 0)} ${this._unit(d.drv_temp, "°C")}` : null]])}</div>`;
      }).join("")}</div>`
      : "";

    // --- ressources
    const gauge = (id, icon, label, v, digits, unit, lvl, sub) => (v === null ? "" : `<div class="srv-g" data-entity="${esc(id)}">
        <div class="srv-gt"><span><ha-icon icon="${icon}"></ha-icon>${label}</span><b>${fmt(v, digits)}<small>${unit}</small></b></div>
        <div class="g-bar ${lvl}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>${sub ? `<div class="srv-gs">${sub}</div>` : ""}</div>`);
    const res = [
      gauge(m.cpu, "mdi:cpu-64-bit", "CPU", this._num(m.cpu), 0, " %", level(this._num(m.cpu), 70, 90)),
      gauge(m.ram, "mdi:memory", "RAM", this._num(m.ram), 0, " %", level(this._num(m.ram), 80, 92)),
      ...m.volumes.map((v, i) => gauge(v.used, "mdi:harddisk", i === 0 && c.volume_name ? esc(c.volume_name) : `Volume ${v.n}`, this._num(v.used), 1, " %", level(this._num(v.used), 75, 90))),
      ...m.usb.map((u, i) => gauge(u.entity, u.icon || "mdi:usb-flash-drive", esc(u.name || (m.usb.length > 1 ? `USB ${i + 1}` : "USB")), this._num(u.entity), 1, " %", level(this._num(u.entity), 75, 90))),
    ].filter(Boolean);

    // --- températures et ventilation
    const tTile = (id, icon, label) => {
      const v = this._num(id);
      if (v === null) return "";
      const cls = v >= c.temp_alert ? "bad" : v >= c.temp_warn ? "warn" : "";
      return `<div class="tile srv-b nas-th ${cls}" data-entity="${esc(id)}"><ha-icon icon="${icon}"></ha-icon><div class="tile-l">${label}</div><div class="srv-bv">${fmt(v, 0)} ${esc(this._unit(id, "°C"))}</div></div>`;
    };
    const fanSt = this._txt(m.fan);
    const fanFr = fanSt ? ({ quiet: "Silencieux", cool: "Frais", full_speed: "Vitesse max", full: "Vitesse max", low_power: "Économie" }[fanSt] || fanSt) : null;
    const thermal = [
      tTile(m.temperature, "mdi:nas", "NAS"),
      ...m.drives.map((d) => tTile(d.drv_temp, "mdi:harddisk", `Disque ${d.n}`)),
      m.fan ? `<div class="tile srv-b" data-entity="${esc(m.fan)}" data-hold="${esc(m.fan)}" title="Appui long : mode suivant"><ha-icon icon="${fanSt === "quiet" ? "mdi:fan-speed-1" : fanSt === "cool" ? "mdi:fan-speed-2" : "mdi:fan-speed-3"}"></ha-icon><div class="tile-l">Ventilateur</div><div class="srv-bv nas-sm">${esc(fanFr || "—")}</div></div>` : "",
    ].filter(Boolean);

    // --- actions : redémarrage (2 clics) et interrupteurs (appui long)
    const acts = [];
    // Marche / arrêt : allumé → Éteindre (arrêt propre par DSM), éteint → Allumer ; deux clics pour confirmer
    const pwr = online ? (this._st(m.shutdown) ? m.shutdown : null) : (this._st(m.power_on) ? m.power_on : null);
    if (pwr) {
      const armed = this._armed === pwr;
      acts.push(`<div class="tile srv-b nas-act nas-power ${online ? "good" : "bad"} ${armed ? "armed" : ""}" data-press="${esc(pwr)}"><ha-icon icon="mdi:power"></ha-icon><div class="tile-l">${armed ? "Confirmer ?" : online ? "Éteindre" : "Allumer"}</div><div class="tile-n">${online ? "Allumé" : "Éteint"}</div></div>`);
    }
    if (online && m.reboot && this._st(m.reboot)) {
      const armed = this._armed === m.reboot;
      acts.push(`<div class="tile srv-b nas-act nas-reboot ${armed ? "armed" : ""}" data-press="${esc(m.reboot)}"><ha-icon icon="mdi:restart"></ha-icon><div class="tile-l">${armed ? "Confirmer ?" : "Redémarrer"}</div><div class="tile-n">${esc(title)}</div></div>`);
    }
    for (const a of m.actions) {
      const s = this._st(a.entity);
      // déjà présent dans la tuile marche / arrêt ou Redémarrer : pas de doublon
      if (!s || [m.shutdown, m.power_on, m.reboot].includes(a.entity)) continue;
      const domain = a.entity.split(".")[0];
      if (domain === "button") {
        const armed = this._armed === a.entity;
        acts.push(`<div class="tile srv-b nas-act ${armed ? "armed" : ""}" data-press="${esc(a.entity)}"><ha-icon icon="${esc(a.icon || "mdi:gesture-tap-button")}"></ha-icon><div class="tile-l">${armed ? "Confirmer ?" : esc(a.name || s.attributes?.friendly_name || a.entity)}</div></div>`);
      } else {
        const on = s.state === "on";
        acts.push(`<div class="tile srv-b nas-act ${on ? "good" : s.state === "off" ? "bad" : ""}" data-entity="${esc(a.entity)}" data-hold="${esc(a.entity)}" title="Appui long : marche / arrêt">
          <ha-icon icon="${esc(a.icon || s.attributes?.icon || "mdi:power")}"></ha-icon><div class="tile-l">${esc(a.name || s.attributes?.friendly_name || a.entity)}</div><div class="tile-n">${on ? "Allumé" : s.state === "off" ? "Éteint" : "Indisponible"}</div></div>`);
      }
    }

    // --- réseau
    const netMax = Number(c.net_max) || 1000;
    const net = (id, icon, label, cls) => {
      if (!id) return "";
      const v = this._num(id);
      const unit = this._unit(id, "");
      const mb = v === null ? null : toMbit(v, unit);
      return `<div class="srv-g ${cls}" data-entity="${esc(id)}"><div class="srv-gt"><span><ha-icon icon="${icon}"></ha-icon>${label}</span><b>${v !== null ? fmt(v, v < 10 ? 1 : 0) : "—"}<small> ${esc(unit)}</small></b></div>
        <div class="g-bar"><i style="width:${mb === null ? 0 : Math.min(100, (mb / netMax) * 100)}%"></i></div></div>`;
    };
    const nets = [net(m.net_down, "mdi:download", "Download", "srv-in"), net(m.net_up, "mdi:upload", "Upload", "srv-out")].filter(Boolean);

    // --- onduleur
    let ups = "";
    if (Object.keys(m.ups).length) {
      const bar = (id, icon, label, max, cls) => {
        const v = this._num(id);
        return v === null ? "" : `<div class="srv-g ${cls}" data-entity="${esc(id)}"><div class="srv-gt"><span><ha-icon icon="${icon}"></ha-icon>${label}</span><b>${fmt(v, 0)}<small> ${esc(this._unit(id, ""))}</small></b></div>
          <div class="g-bar"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i></div></div>`;
      };
      const batt = this._num(m.ups.battery);
      const upsDev = Object.values(this._hass.devices || {}).find((d) => d.id === this._hass.entities?.[m.ups.status || m.ups.status_raw]?.device_id);
      const upsName = c.ups_name || [upsDev?.manufacturer, upsDev?.model].filter(Boolean).join(" ") || upsDev?.name || "Onduleur";
      ups = `<div class="srv-state ${upsOk === null ? "" : upsOk ? "ok" : "bad"} nas-ups" data-entity="${esc(m.ups.status || m.ups.status_raw)}">
          <ha-icon icon="mdi:power-plug-battery-outline"></ha-icon><span>${esc(upsName)}</span><b>${esc([fr(upsSt), upsRaw].filter(Boolean).join(" · ") || "—")}</b></div>
        <div class="srv-grid nas-ups-g">${[
          bar(m.ups.input, "mdi:transmission-tower-import", "Entrée", 250, "nas-in"),
          bar(m.ups.output, "mdi:transmission-tower-export", "Sortie", 250, "srv-in"),
          bar(m.ups.load, "mdi:gauge", "Charge", 100, "nas-load"),
          batt === null ? "" : `<div class="srv-g" data-entity="${esc(m.ups.battery)}"><div class="srv-gt"><span><ha-icon icon="mdi:battery"></ha-icon>Batterie</span><b>${fmt(batt, 0)}<small> %</small></b></div>
            <div class="g-bar ${batt >= 50 ? "b-ok" : batt >= 20 ? "b-warn" : "b-alert"}"><i style="width:${batt}%"></i></div></div>`,
        ].join("")}</div>`;
    }

    const body = [
      c.show_info !== false ? sec("mdi:information-outline", "Informations", info.length ? `<div class="tiles srv-tiles">${info.join("")}</div>${panel}` : "") : "",
      c.show_resources !== false ? sec("mdi:speedometer", "Ressources", res.length ? `<div class="srv-grid nas-res">${res.join("")}</div>` : "") : "",
      c.show_thermal !== false ? sec("mdi:thermometer-lines", "Températures et ventilation", thermal.length ? `<div class="srv-bk">${thermal.join("")}</div>` : "") : "",
      c.show_actions !== false ? sec("mdi:gesture-tap-button", "Actions", acts.length ? `<div class="srv-bk">${acts.join("")}</div>` : "") : "",
      c.show_network !== false ? sec("mdi:swap-vertical", "Débits réseau", nets.length ? `<div class="srv-grid">${nets.join("")}</div>` : "") : "",
      c.show_ups !== false ? sec("mdi:power-plug-battery-outline", "Onduleur", ups) : "",
    ].join("");

    const alertCls = online === false || hddOk === false || secOk === false || upsOk === false ? "srv-alert" : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${NAS_STYLE}<ha-card class="${themeClass(c.theme, this._hass)} ${alertCls}">
      <header>
        <div class="brand" ${c.navigation_path ? `data-nav="${esc(c.navigation_path)}"` : `data-entity="${esc(m.tracker || m.cpu || "")}"`} style="cursor:pointer">
          <ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:nas")}" style="color:${esc(c.icon_color || "var(--med-blue)")}"></ha-icon>
          <div><div class="title">${esc(title)}</div><div class="sub">${online === false ? "NAS indisponible" : "NAS disponible"}</div>${sub2 ? `<div class="sub srv-head">${esc(sub2)}</div>` : ""}</div>
        </div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body || `<div class="empty">Aucune entité Synology trouvée<span>Ajoutez l'intégration Synology DSM, ou indiquez le préfixe de vos entités (<code>prefix: diskstation</code>) dans la configuration.</span></div>`}
    </ha-card>`;
  }
}

const NAS_STYLE = `<style>
.srv-kv b.ok { color: var(--med-down); } .srv-kv b.bad { color: var(--t-red); }
.nas-health { cursor: pointer; }
.nas-health.bad { border-color: var(--t-red); }
.nas-dsm.up { border-color: #f0a33a; } .nas-dsm.up .tile-l ha-icon, .nas-dsm.up b.bad { color: #f0a33a; }
.nas-health .tile-l ha-icon:first-child { color: var(--med-down); }
.nas-health.bad .tile-l ha-icon:first-child { color: var(--t-red); }
.nas-chev { margin-left: auto; --mdc-icon-size: 18px; color: var(--med-muted) !important; }
.nas-up { font-weight: 700; font-size: 1rem; margin-top: 4px; }
.nas-panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; margin-top: 8px; }
.nas-drv { padding: 10px 12px; border-radius: 12px; border: 1px solid var(--med-line); background: var(--med-surface); cursor: pointer; }
.nas-drv-h { display: flex; align-items: center; gap: 6px; font-weight: 700; margin-bottom: 6px; }
.nas-drv-h ha-icon { --mdc-icon-size: 18px; color: var(--med-blue); }
.nas-res { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
.nas-res .srv-gt b { font-size: 1.05rem; }
.nas-th { border-color: color-mix(in srgb, #f0a33a 35%, transparent); }
.nas-th ha-icon { color: #f0a33a !important; }
.nas-th.warn .srv-bv { color: #f0a33a; }
.nas-th.bad { border-color: var(--t-red); } .nas-th.bad .srv-bv, .nas-th.bad ha-icon { color: var(--t-red) !important; }
.nas-sm { font-size: .82rem; }
.nas-act { cursor: pointer; }
.nas-reboot { border-color: color-mix(in srgb, var(--t-red) 40%, transparent); }
.nas-reboot ha-icon { color: var(--t-red) !important; }
.nas-act.armed { border-color: #f0a33a; background: color-mix(in srgb, #f0a33a 16%, transparent); }
.nas-act.armed .tile-l { color: #f0a33a; font-weight: 700; }
.nas-ups { margin-bottom: 8px; }
.nas-ups-g { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.nas-in .g-bar i { background: var(--med-blue); }
.nas-load .g-bar i { background: #f0a33a; }
</style>`;

/* ------------------------------------------------------------ carte Proxmox VE */

const PVE_DEFAULTS = {
  title: "Proxmox",
  icon: "mdi:server-network",
  icon_color: "",
  sort: "status", // status (en marche d'abord), name, cpu, ram
  hide_stopped: false,
  show_node: true, show_storage: true, show_guests: true, show_actions: true,
  theme: "v2",
};

/** Rôle d'une entité Proxmox VE : clé de traduction d'abord, sinon fin du nom (français ou anglais). */
const PVE_ROLES = [
  ["status", "sensor", /^(status|node_status|vm_status|container_status)$/, /_(statut|status|etat)(?:_\d+)?$/],
  ["running", "binary_sensor", /^(status|running|vm_running|container_running|node_running)$/, /_(statut|status|etat|running|en_cours)(?:_\d+)?$/],
  ["cpu", "sensor", /cpu/, /_(utilisation_du_processeur|cpu_usage|cpu_utilization|cpu|processeur)(?:_\d+)?$/],
  ["mem", "sensor", /^(memory_usage_percentage|memory_percentage|memory_usage_percent)$/, /_(pourcentage_d_utilisation_de_la_memoire|memory_usage_percentage|memory_percentage|memory_usage_percent)(?:_\d+)?$/],
  ["mem_max", "sensor", /^(max_memory|memory_max|memory_total)$/, /_(utilisation_maximale_de_la_memoire|memoire_maximale|max_memory|memory_max|memory_total)(?:_\d+)?$/],
  ["uptime", "sensor", /uptime/, /_(temps_de_fonctionnement|uptime|demarrage)(?:_\d+)?$/],
  ["st_pct", "sensor", /storage.*(percent|usage)|disk_usage/, /_(pourcentage_d_utilisation_du_stockage|storage_usage_percentage|storage_percentage|disk_usage_percentage)(?:_\d+)?$/],
  ["st_used", "sensor", /^(storage_used|disk_used)$/, /_(stockage_utilise|storage_used|disk_used)(?:_\d+)?$/],
  ["st_total", "sensor", /^(storage_total|disk_total|disk_max)$/, /_(stockage_total|storage_total|disk_total)(?:_\d+)?$/],
  ["start_all", "button", /start_all/, /_(tout_demarrer|start_all)(?:_\d+)?$/],
  ["stop_all", "button", /stop_all|shutdown_all/, /_(tout_arreter|stop_all|shutdown_all)(?:_\d+)?$/],
  ["start", "button", /^start$/, /_(demarrer|start)(?:_\d+)?$/],
  ["reboot", "button", /^(reboot|restart)$/, /_(redemarrer|reboot|restart)(?:_\d+)?$/],
  ["shutdown", "button", /^shutdown$/, /_(arreter|shutdown|stop)(?:_\d+)?$/],
  ["stop", "button", /^stop$/, /_(stop)(?:_\d+)?$/],
  ["vm", "button", /^(pause|suspend|resume|reset)$/, /_(pause|suspend|suspendre|reinitialiser|reset)(?:_\d+)?$/],
  ["update", "update", /./, /./],
];
const pveRole = (id, ent) => {
  const domain = id.split(".")[0];
  const tk = ent?.translation_key || "";
  for (const [role, d, reTk, reId] of PVE_ROLES) {
    if (d !== domain) continue;
    if (tk && reTk.test(tk)) return role;
  }
  for (const [role, d, , reId] of PVE_ROLES) {
    if (d === domain && reId.test(id)) return role;
  }
  return null;
};
const PVE_STATE = {
  online: ["En ligne", "ok"], offline: ["Hors ligne", "bad"], running: ["En marche", "ok"], stopped: ["Arrêté", "off"],
  paused: ["En pause", "warn"], suspended: ["Suspendu", "warn"], prelaunch: ["Démarrage", "warn"], unknown: ["Inconnu", "off"], unavailable: ["Indisponible", "bad"],
};
const pveState = (s) => PVE_STATE[String(s ?? "unknown").toLowerCase()] || [String(s), "off"];
const gib = (v) => (v === null ? null : `${fmt(v, v < 10 ? 1 : 0)} Go`);
/** Invité protégé par défaut : la VM qui fait tourner Home Assistant (nom contenant haos ou home assistant). */
const PVE_PROTECT = /haos|home[\s_-]?assistant|hassos/i;

class ServeurHaProxmoxCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-proxmox-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...PVE_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const tab = ev.target.closest?.("[data-tab]");
        if (tab) {
          this._tab = tab.dataset.tab;
          try { localStorage.setItem(this._tabKey(), JSON.stringify(this._tab)); } catch (e) { /* stockage indisponible */ }
          this._sig = null; this._render(); return;
        }
        const press = ev.target.closest?.("[data-press]");
        if (press) {
          // Bouton (démarrer, arrêter, redémarrer) : premier clic arme, second clic dans les 5 s confirme
          ev.stopPropagation();
          const id = press.dataset.press;
          if (this._armed === id) {
            this._armed = null;
            this._hass?.callService("button", "press", { entity_id: id });
          } else {
            this._armed = id;
            clearTimeout(this._armTimer);
            this._armTimer = setTimeout(() => { this._armed = null; this._sig = null; this._render(); }, 5000);
          }
          this._sig = null; this._render(); return;
        }
        const el = ev.target.closest?.("[data-entity]");
        if (el?.dataset.entity) {
          const e = new Event("hass-more-info", { bubbles: true, composed: true });
          e.detail = { entityId: el.dataset.entity };
          this.dispatchEvent(e);
        }
      }));
    }
    this._render();
  }

  set hass(hass) {
    if (this._hass?.entities !== hass.entities || this._hass?.devices !== hass.devices) this._map = null;
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    clearInterval(this._tick);
    this._tick = setInterval(() => { this._sig = null; this._render(); }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
  }

  getCardSize() {
    return 10;
  }

  _st(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  _num(id) {
    const s = this._st(id);
    if (!s || s.state === "unavailable" || s.state === "unknown") return null;
    const v = Number(s.state);
    return Number.isFinite(v) ? v : null;
  }

  _tabKey() {
    return `serveur-ha-proxmox:${this._config.title || ""}`;
  }

  /** Nœuds, invités (VM et conteneurs) et stockages, regroupés par appareil Proxmox VE. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass, c = this._config;
    const devs = hass.devices || {};
    const byDev = {};
    for (const [id, e] of Object.entries(hass.entities || {})) {
      if (e.platform !== "proxmoxve" || !hass.states[id] || !e.device_id || e.hidden) continue;
      const role = pveRole(id, e);
      if (!role) continue;
      const d = (byDev[e.device_id] ||= { id: e.device_id, roles: {}, series: {} });
      // stockage : un appareil par nom de stockage pour tous les nœuds ; une série de capteurs par nœud (_2, _3…)
      if (role.startsWith("st_")) { const sfx = (/_\d+$/.exec(id) || [""])[0]; ((d.series[sfx] ||= {})[role] ||= id); }
      // deux boutons « Arrêter » sur les VM : arrêt propre (shutdown) et arrêt forcé (stop)
      if (role === "shutdown" && d.roles.shutdown && !/shutdown/.test(e.translation_key || "")) { d.roles.stop ||= id; continue; }
      d.roles[role] ||= id;
    }
    const nameOf = (dev) => dev?.name_by_user || dev?.name || "";
    const nodes = [], guests = [], storages = [];
    for (const d of Object.values(byDev)) {
      const dev = devs[d.id] || {};
      d.name = nameOf(dev);
      d.parent = dev.via_device_id || null;
      const st = String(this._st(d.roles.status)?.state || "").toLowerCase();
      const model = `${dev.model || ""} ${dev.entry_type || ""}`.toLowerCase();
      if (d.roles.st_pct || d.roles.st_total || /storage/.test(model) || /^storage\b|stockage/i.test(d.name)) {
        const short = (/\(([^)]+)\)/.exec(d.name) || [, d.name])[1];
        // nœud de chaque série : lu dans l'identifiant unique (<entrée>_<nœud>_<stockage>_<mesure>), sinon le nœud de l'appareil
        for (const [sfx, roles] of Object.entries(d.series)) {
          const node = Object.values(roles).map((id) => this._stNode?.[id]).find(Boolean);
          // identifiants illisibles (droits) : la série reste sur le nœud de l'appareil, numérotée
          const done = this._stNode !== undefined;
          storages.push({ id: d.id + sfx, name: d.name, short: !node && done && sfx ? `${short} (${sfx.slice(1)})` : short, raw: short,
            roles, parent: d.parent, nodeName: node || null, guess: !node && sfx !== "" && !done });
        }
      } else if (d.roles.start_all || d.roles.stop_all || d.roles.update || /node|n[oœ]ud/.test(model) || ["online", "offline"].includes(st)) {
        nodes.push(d);
      } else {
        d.vm = !!d.roles.vm || /qemu|\bvm\b/.test(model);
        if (/lxc|container|conteneur/.test(model)) d.vm = false;
        guests.push(d);
      }
    }
    const want = (Array.isArray(c.nodes) ? c.nodes : c.nodes ? [c.nodes] : []).map((x) => String(x).toLowerCase());
    const list = nodes.filter((n) => !want.length || want.includes(n.name.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    const protect = (Array.isArray(c.protect) ? c.protect : c.protect ? [c.protect] : []).map((x) => String(x).toLowerCase());
    for (const g of guests) {
      g.protected = protect.length ? protect.includes(g.name.toLowerCase()) : PVE_PROTECT.test(g.name);
    }
    const nodeKey = (n) => [devs[n.id]?.name, devs[n.id]?.name_by_user, n.name].filter(Boolean).map((x) => String(x).toLowerCase());
    for (const s of storages) {
      if (!s.nodeName) continue;
      const n = nodes.find((x) => nodeKey(x).includes(s.nodeName.toLowerCase()));
      if (n) { s.parent = n.id; s.guess = false; }
    }
    // séries supplémentaires dont le nœud n'est pas encore connu : en attente de l'identifiant unique
    const known = storages.filter((s) => !s.guess);
    for (const n of list) {
      n.guests = guests.filter((g) => g.parent === n.id);
      n.storages = known.filter((s) => s.parent === n.id).sort((a, b) => a.short.localeCompare(b.short, "fr"));
    }
    this._askStorageNodes(storages);
    // invités et stockages sans nœud connu (appareil non rattaché) : avec le seul nœud, ou dans « Autres »
    const orphans = guests.filter((g) => !nodes.some((n) => n.id === g.parent));
    const orphanSt = known.filter((s) => !nodes.some((n) => n.id === s.parent));
    if (list.length === 1) { list[0].guests.push(...orphans); list[0].storages.push(...orphanSt); }
    else if (orphans.length || orphanSt.length) list.push({ id: "_autres", name: "Autres", roles: {}, guests: orphans, storages: orphanSt, other: true });
    this._map = { nodes: list, guests, storages };
    return this._map;
  }

  /** Identifiants uniques des capteurs de stockage (registre des entités, un seul appel) : ils portent le nom du nœud. */
  _askStorageNodes(storages) {
    if (this._stAsked || typeof this._hass?.callWS !== "function") return;
    const ids = storages.flatMap((s) => Object.values(s.roles));
    if (!ids.length) return;
    this._stAsked = true;
    this._hass.callWS({ type: "config/entity_registry/get_entries", entity_ids: ids }).then((res) => {
      const out = {};
      for (const [id, e] of Object.entries(res || {})) {
        const uid = e?.unique_id, entry = e?.config_entry_id;
        const st = storages.find((s) => Object.values(s.roles).includes(id));
        if (!uid || !st) continue;
        // <entrée>_<nœud>_<stockage>_<mesure> : le nœud est entre l'entrée et « _<stockage>_ »
        const rest = entry && uid.startsWith(`${entry}_`) ? uid.slice(entry.length + 1) : uid.replace(/^[^_]+_/, "");
        const i = rest.lastIndexOf(`_${st.raw}_`);
        if (i > 0) out[id] = rest.slice(0, i);
      }
      this._stNode = out;
    }).catch(() => { this._stNode = {}; }).finally(() => { this._map = null; this._sig = null; this._render(); });
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    if (this._tab === undefined) { try { this._tab = JSON.parse(localStorage.getItem(this._tabKey()) || "null"); } catch (e) { this._tab = null; } }
    const node = m.nodes.find((n) => n.id === this._tab) || m.nodes[0];
    const ids = [...m.nodes, ...m.guests, ...m.storages].flatMap((d) => Object.values(d.roles));
    // en attendant l'identifiant unique, seule la première série d'un stockage est rattachée à son nœud
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${node?.id}|${this._armed}|${Math.floor(Date.now() / 60000)}|` + ids.map((id) => this._st(id)?.state ?? "-").join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const running = (g) => {
      const s = String(this._st(g.roles.status)?.state || "").toLowerCase();
      return s ? s === "running" : this._st(g.roles.running)?.state === "on";
    };
    const nodeUp = (n) => {
      const s = String(this._st(n.roles.status)?.state || "").toLowerCase();
      return n.other ? true : s ? s === "online" : this._st(n.roles.running)?.state === "on";
    };
    const allGuests = m.nodes.flatMap((n) => n.guests);
    const up = allGuests.filter(running).length;
    const updates = m.nodes.filter((n) => this._st(n.roles.update)?.state === "on");
    const down = m.nodes.filter((n) => !nodeUp(n));
    const led = (ok, label, id, cls = "") => `<span class="srv-led ${ok ? "ok" : "bad"} ${cls}" data-entity="${esc(id || "")}"><i></i>${label}</span>`;
    const leds = m.nodes.length ? [
      led(!down.length, `Nœuds ${m.nodes.filter((n) => !n.other).length - down.length}/${m.nodes.filter((n) => !n.other).length}`, (down[0] || m.nodes[0]).roles.status),
      updates.length ? `<span class="srv-led upd" data-entity="${esc(updates[0].roles.update)}"><i></i>Mise à jour</span>` : "",
    ].join("") : "";

    const sec = (icon, t, body, extra = "") => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${icon}"></ha-icon>${t}${extra}</div>${body}</div>` : "");
    const gauge = (id, icon, label, v, sub, warn = 75, alert = 90) => (v === null ? "" : `<div class="srv-g" data-entity="${esc(id)}">
        <div class="srv-gt"><span><ha-icon icon="${icon}"></ha-icon>${label}</span><b>${fmt(v, 0)}<small> %</small></b></div>
        <div class="g-bar ${level(v, warn, alert)}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>${sub ? `<div class="srv-gs">${sub}</div>` : ""}</div>`);
    const btn = (id, icon, label, cls = "") => {
      if (!id || !this._st(id)) return "";
      const armed = this._armed === id;
      // armé : coche orange (petits boutons), « Confirmer » sur les grands boutons du nœud
      return `<button class="pve-btn ${cls} ${armed ? "armed" : ""}" data-press="${esc(id)}" title="${esc(armed ? `${label} : cliquez encore pour confirmer` : label)}" aria-label="${esc(armed ? `Confirmer : ${label}` : label)}"><ha-icon icon="${armed ? "mdi:check-bold" : icon}"></ha-icon>${armed && /wide/.test(cls) ? "<span>Confirmer</span>" : ""}</button>`;
    };

    let body = "";
    if (!node) {
      body = `<div class="empty">Aucun nœud Proxmox VE trouvé<span>Ajoutez l'intégration Proxmox VE (Paramètres › Appareils et services), puis rechargez la page.</span></div>`;
    } else {
      const tabs = m.nodes.length > 1 ? `<div class="pve-tabs" role="tablist">${m.nodes.map((n) => `<button class="pve-tab ${n.id === node.id ? "on" : ""}" role="tab" aria-selected="${n.id === node.id}" data-tab="${esc(n.id)}">
          <i class="pve-dot ${nodeUp(n) ? "ok" : "bad"}"></i>${esc(n.name)}<small>${n.guests.filter(running).length}/${n.guests.length}</small>${this._st(n.roles.update)?.state === "on" ? `<ha-icon class="pve-up" icon="mdi:arrow-up-circle"></ha-icon>` : ""}</button>`).join("")}</div>` : "";

      // --- nœud
      let nodeHtml = "";
      if (!node.other && c.show_node !== false) {
        const [stTxt, stCls] = pveState(this._st(node.roles.status)?.state || (nodeUp(node) ? "online" : "offline"));
        const boot = nodeUp(node) ? this._st(node.roles.uptime)?.state : null;
        const upd = this._st(node.roles.update);
        const inst = upd?.attributes?.installed_version, last = upd?.attributes?.latest_version;
        const memMax = this._num(node.roles.mem_max), memPct = this._num(node.roles.mem);
        const tiles = [
          `<div class="tile srv-t" data-entity="${esc(node.roles.status || node.roles.running || "")}"><div class="tile-l"><ha-icon icon="mdi:server"></ha-icon>${esc(node.name)}</div><div class="pve-st ${stCls}"><i></i>${stTxt}</div></div>`,
          boot && since(boot) ? `<div class="tile srv-t" data-entity="${esc(node.roles.uptime)}"><div class="tile-l"><ha-icon icon="mdi:clock-start"></ha-icon>Uptime</div><div class="nas-up">${esc(since(boot))}</div></div>` : "",
          upd ? `<div class="tile srv-t nas-dsm ${upd.state === "on" ? "up" : ""}" data-entity="${esc(node.roles.update)}" title="${esc([inst, upd.state === "on" ? `→ ${last}` : ""].filter(Boolean).join(" "))}"><div class="tile-l"><ha-icon icon="${upd.state === "on" ? "mdi:package-up" : "mdi:package-check"}"></ha-icon>Proxmox</div>
            <div class="srv-kv"><span>${upd.state === "on" ? "Dispo" : "Version"}</span><b class="${upd.state === "on" ? "bad" : ""}">${esc((upd.state === "on" ? last : inst) || "—")}</b></div>
            <div class="srv-kv"><span>État</span><b class="${upd.state === "on" ? "bad" : "ok"}">${upd.state === "on" ? "À installer" : "À jour"}</b></div></div>` : "",
        ].filter(Boolean);
        const res = [
          gauge(node.roles.cpu, "mdi:cpu-64-bit", "CPU", this._num(node.roles.cpu), "", 70, 90),
          gauge(node.roles.mem, "mdi:memory", "RAM", memPct, memMax !== null && memPct !== null ? `${gib((memPct / 100) * memMax)} / ${gib(memMax)}` : "", 80, 92),
        ].filter(Boolean);
        nodeHtml = sec("mdi:server", "Nœud", `<div class="tiles srv-tiles">${tiles.join("")}</div>${res.length ? `<div class="srv-grid pve-res">${res.join("")}</div>` : ""}`);
      }

      // --- stockages
      const stor = c.show_storage !== false ? node.storages.map((s) => {
        const pct = this._num(s.roles.st_pct), used = this._num(s.roles.st_used), total = this._num(s.roles.st_total);
        const v = pct ?? (used !== null && total ? (used / total) * 100 : null);
        return gauge(s.roles.st_pct || s.roles.st_used, "mdi:harddisk", esc(s.short || s.name), v, used !== null && total !== null ? `${gib(used)} / ${gib(total)}` : "", 80, 90);
      }).filter(Boolean) : [];

      // --- invités
      const rank = { status: (g) => (running(g) ? 0 : 1), cpu: (g) => -(this._num(g.roles.cpu) ?? -1), ram: (g) => -(this._num(g.roles.mem) ?? -1) }[c.sort];
      let gs = node.guests.slice().sort((a, b) => (rank ? rank(a) - rank(b) : 0) || a.name.localeCompare(b.name, "fr"));
      if (c.hide_stopped) gs = gs.filter(running);
      // nœud hors ligne : aucun bouton (rien ne peut être démarré ni arrêté)
      const canAct = c.show_actions !== false && (node.other || nodeUp(node));
      const rows = c.show_guests !== false ? gs.map((g) => {
        const on = running(g);
        const [stTxt, stCls] = pveState(this._st(g.roles.status)?.state || (on ? "running" : "stopped"));
        const cpu = this._num(g.roles.cpu), mem = this._num(g.roles.mem), memMax = this._num(g.roles.mem_max);
        const boot = on ? this._st(g.roles.uptime)?.state : null;
        const meta = [stTxt, on && boot && since(boot) ? since(boot) : null].filter(Boolean).join(" · ");
        const acts = !canAct ? "" : on
          ? (g.protected ? `<span class="pve-lock" title="Protégé : pas d'arrêt ni de redémarrage depuis la carte"><ha-icon icon="mdi:shield-lock-outline"></ha-icon></span>`
            : btn(g.roles.reboot, "mdi:restart", `Redémarrer ${g.name}`) + btn(g.roles.shutdown || g.roles.stop, "mdi:stop", `Arrêter ${g.name}`, "stop"))
          : btn(g.roles.start, "mdi:play", `Démarrer ${g.name}`, "go");
        return `<div class="pve-g ${on ? "" : "off"}" data-entity="${esc(g.roles.status || g.roles.running || g.roles.cpu || "")}">
          <ha-icon class="pve-gi" icon="${g.vm ? "mdi:monitor" : "mdi:cube-outline"}" title="${g.vm ? "Machine virtuelle" : "Conteneur LXC"}"></ha-icon>
          <div class="pve-gn"><b>${esc(g.name)}</b><span><i class="pve-dot ${stCls}"></i>${esc(meta)}</span></div>
          ${on ? `<div class="pve-gm"><span title="CPU">${cpu === null ? "—" : `${fmt(cpu, cpu < 10 ? 1 : 0)} %`}</span><span title="RAM${memMax !== null ? ` sur ${gib(memMax)}` : ""}">${mem === null ? "—" : `${fmt(Math.min(mem, 999), 0)} %`}</span></div>` : `<div class="pve-gm"></div>`}
          <div class="pve-ga">${acts}</div></div>`;
      }) : [];
      const head = rows.length ? `<div class="pve-gh"><span></span><span></span><div class="pve-gm"><span>CPU</span><span>RAM</span></div><span></span></div>` : "";

      // --- actions du nœud (rien d'arrêtable s'il porte un invité protégé en marche)
      const guard = node.guests.some((g) => g.protected && running(g));
      const nodeActs = !node.other && canAct ? [
        btn(node.roles.start_all, "mdi:play-box-multiple-outline", "Tout démarrer", "go wide"),
        guard ? "" : btn(node.roles.reboot, "mdi:restart", `Redémarrer ${node.name}`, "wide"),
        guard ? "" : btn(node.roles.shutdown, "mdi:power", `Arrêter ${node.name}`, "stop wide"),
      ].filter(Boolean) : [];

      body = tabs + nodeHtml
        + sec("mdi:harddisk", "Stockage", stor.length ? `<div class="srv-grid pve-res">${stor.join("")}</div>` : "")
        + sec(node.other ? "mdi:help-circle-outline" : "mdi:cube-outline", `Invités <small class="pve-n">${node.guests.filter(running).length}/${node.guests.length} en marche</small>`, rows.length ? `<div class="pve-list">${head}${rows.join("")}</div>` : "")
        + sec("mdi:gesture-tap-button", "Actions du nœud", nodeActs.length ? `<div class="pve-na">${nodeActs.join("")}</div>${guard ? `<div class="srv-gs pve-guard"><ha-icon icon="mdi:shield-lock-outline"></ha-icon>Redémarrage et arrêt masqués : ce nœud fait tourner Home Assistant.</div>` : ""}` : "");
    }

    const alertCls = down.length ? "srv-alert" : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${NAS_STYLE}${PVE_STYLE}<ha-card class="${themeClass(c.theme, this._hass)} ${alertCls}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:server-network")}" style="color:${esc(c.icon_color || "var(--med-blue)")}"></ha-icon>
          <div><div class="title">${esc(c.title || "Proxmox")}</div><div class="sub">${m.nodes.length ? `${m.nodes.filter((n) => !n.other).length} nœud${m.nodes.filter((n) => !n.other).length > 1 ? "s" : ""} · ${up}/${allGuests.length} invités en marche` : "Proxmox VE"}</div></div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const PVE_STYLE = `<style>
.pve-tabs { display: flex; gap: 6px; padding: 2px 12px 0; overflow-x: auto; scrollbar-width: none; }
.pve-tab { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; white-space: nowrap;
  border: 1px solid var(--med-line); background: var(--med-surface); font-size: .82rem; font-weight: 600; }
.pve-tab small { color: var(--med-muted); font-weight: 500; }
.pve-tab.on { border-color: var(--med-blue); box-shadow: inset 0 -2px 0 var(--med-blue); }
.pve-tab:focus-visible { outline: 2px solid var(--med-blue); }
.pve-up { --mdc-icon-size: 15px; color: #f0a33a; }
.pve-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; background: var(--med-muted); }
.pve-dot.ok { background: var(--med-down); } .pve-dot.bad { background: var(--t-red); } .pve-dot.warn { background: #f0a33a; }
.pve-st { display: flex; align-items: center; gap: 6px; font-weight: 700; margin-top: 2px; }
.pve-st i { width: 8px; height: 8px; border-radius: 50%; background: var(--med-muted); }
.pve-st.ok { color: var(--med-down); } .pve-st.ok i { background: var(--med-down); }
.pve-st.bad { color: var(--t-red); } .pve-st.bad i { background: var(--t-red); }
.pve-res { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); margin-top: 8px; }
.srv-sec > .pve-res:first-child { margin-top: 0; }
.pve-n { font-weight: 500; color: var(--med-muted); font-size: .76rem; margin-left: 4px; }
.pve-list { display: grid; gap: 4px; }
.pve-g, .pve-gh { display: grid; grid-template-columns: 22px minmax(0, 1fr) 96px 64px; align-items: center; gap: 10px; }
.pve-g { padding: 8px 10px; border-radius: 12px; border: 1px solid var(--med-line); background: var(--med-surface); cursor: pointer; }
.pve-gh { padding: 0 10px; font-size: .7rem; color: var(--med-muted); }
.pve-g.off { opacity: .55; }
.pve-gi { --mdc-icon-size: 20px; color: var(--med-blue); }
.pve-gn { min-width: 0; display: grid; }
.pve-gn b { font-size: .86rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pve-gn span { display: flex; align-items: center; gap: 5px; font-size: .72rem; color: var(--med-muted); white-space: nowrap; overflow: hidden; }
.pve-gm { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; text-align: right; font-size: .8rem; font-weight: 600; }
.pve-gh .pve-gm { font-weight: 500; }
.pve-ga { display: flex; gap: 4px; justify-content: flex-end; min-width: 30px; }
.pve-btn { all: unset; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 30px; height: 30px; padding: 0 6px; box-sizing: border-box;
  border-radius: 9px; border: 1px solid var(--med-line); color: var(--med-muted); font-size: .74rem; font-weight: 700; }
.pve-btn ha-icon { --mdc-icon-size: 17px; }
.pve-btn:hover { border-color: var(--med-blue); color: var(--med-text); }
.pve-btn:focus-visible { outline: 2px solid var(--med-blue); }
.pve-btn.go { color: var(--med-down); border-color: color-mix(in srgb, var(--med-down) 45%, transparent); }
.pve-btn.stop { color: var(--t-red); border-color: color-mix(in srgb, var(--t-red) 40%, transparent); }
.pve-btn.armed { color: #f0a33a; border-color: #f0a33a; background: color-mix(in srgb, #f0a33a 18%, transparent); animation: pve-pulse 1s ease-in-out infinite; }
@keyframes pve-pulse { 50% { box-shadow: 0 0 0 3px color-mix(in srgb, #f0a33a 30%, transparent); } }
@media (prefers-reduced-motion: reduce) { .pve-btn.armed { animation: none; } }
.pve-btn.wide { padding: 0 12px; height: 36px; }
.pve-lock { display: inline-flex; color: var(--med-muted); } .pve-lock ha-icon { --mdc-icon-size: 18px; }
.pve-na { display: flex; flex-wrap: wrap; gap: 6px; }
.pve-na .pve-btn::after { content: attr(title); font-weight: 600; }
.pve-na .pve-btn.armed::after { content: none; }
.pve-guard { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.pve-guard ha-icon { --mdc-icon-size: 16px; }
.srv-led.upd i { background: #f0a33a; } .srv-led.upd { border-color: #f0a33a; }
@container (max-width: 360px) { .pve-g, .pve-gh { grid-template-columns: 20px minmax(0, 1fr) 80px 64px; gap: 6px; } }
</style>`;

/* ------------------------------------------------------------------ style */

const STYLE = `<style>
:host {
  --med-bg: #1a2434; --med-surface: #212d40; --med-line: #2f3d55;
  --med-text: #e7edf5; --med-muted: #8fa0b8;
  --med-green: #96d21f; --med-blue: #1d93e3;
  --med-hc: #4a7bd8; --med-hp: #d27333;
  --t-blue: #3f7ff0; --t-white: #e9eef4; --t-red: #ee4a4a;
  --med-up: #f08a4b; --med-down: #5fcf8a;
}
ha-card { background: var(--med-bg); color: var(--med-text); border: 1px solid var(--med-line);
  border-radius: 18px; overflow: hidden; font-variant-numeric: tabular-nums; container-type: inline-size; }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px 8px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 10px; }
.brand svg { width: 34px; height: 34px; fill: none; }
.brand .house { stroke: var(--med-green); stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round; }
.brand .bolt { fill: var(--med-blue); }
.title { font-size: 1.15rem; font-weight: 700; letter-spacing: .2px; }
.sub { font-size: .78rem; color: var(--med-muted); }
.tempo { display: flex; gap: 8px; }
.pill { display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px;
  background: var(--med-surface); border: 1px solid var(--med-line); font-size: .78rem; }
.pill-l { color: var(--med-muted); }
.pill-v { font-weight: 600; }
.dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; background: var(--med-muted); flex: none; }
.t-blue .dot { background: var(--t-blue); } .t-white .dot { background: var(--t-white); } .t-red .dot { background: var(--t-red); }
.t-none .pill-v { color: var(--med-muted); font-weight: 400; }
.quotas { display: flex; align-items: center; gap: 14px; padding: 0 18px 10px; font-size: .82rem; }
.quota { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
.quota small { color: var(--med-muted); font-weight: 400; }
.quota-l { color: var(--med-muted); }

.hero { margin: 4px 12px 0; padding: 16px; border-radius: 14px; background: var(--med-surface);
  border: 1px solid var(--med-line); display: grid; grid-template-columns: 1fr auto; gap: 6px 16px; }
.hero-l { color: var(--med-muted); font-size: .85rem; }
.hero-v { font-size: 2.4rem; font-weight: 700; line-height: 1.1; }
.hero-v span, .tile-v span { font-size: .9rem; font-weight: 500; color: var(--med-muted); margin-left: 4px; }
.hero-r { text-align: right; align-self: center; }
.cost { font-size: 1.6rem; font-weight: 700; color: var(--med-green); }
.cost.none { color: var(--med-muted); }
.cost.est { color: var(--med-text); opacity: .85; }
.hero-p { font-size: .75rem; color: var(--med-muted); margin-top: 6px; }
.cost-l { font-size: .75rem; color: var(--med-muted); max-width: 160px; }
.evo { font-size: .8rem; font-weight: 600; margin-top: 2px; }
.evo.up { color: var(--med-up); } .evo.down { color: var(--med-down); }
.split { grid-column: 1 / -1; margin-top: 6px; }
.split.wait { font-size: .8rem; color: var(--med-muted); border-top: 1px dashed var(--med-line); padding-top: 8px; }
.bar { display: flex; height: 8px; border-radius: 6px; overflow: hidden; background: var(--med-line); }
.bar i { display: block; } .bar .hc { background: var(--med-hc); } .bar .hp { background: var(--med-hp); }
.split-l { display: flex; justify-content: space-between; font-size: .78rem; margin-top: 6px; }
.k-hc { color: #8fb0f0; } .k-hp { color: #eaa070; }

.tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 10px 12px 0; }
@container (min-width: 620px) { .tiles { grid-template-columns: repeat(4, 1fr); } }
@container (min-width: 620px) { .tiles.six { grid-template-columns: repeat(3, 1fr); } }
.tile { padding: 12px; border-radius: 12px; border: 1px solid var(--med-line); }
.tile-l { font-size: .78rem; color: var(--med-muted); }
.tile-v { font-size: 1.35rem; font-weight: 700; margin-top: 2px; }
.tile-n { font-size: .72rem; color: var(--med-muted); margin-top: 4px; }

.chart { margin: 14px 12px 0; }
.chart-h { display: flex; justify-content: space-between; font-size: .82rem; color: var(--med-muted); margin: 0 4px 6px; }
.legend { display: flex; align-items: center; gap: 6px; }
.legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; margin-left: 6px; }
.legend .k-hc { background: var(--med-hc); } .legend .k-hp { background: var(--med-hp); }
.chart svg { width: 100%; height: 130px; display: block; }
.chart rect.hc { fill: var(--med-hc); } .chart rect.hp { fill: var(--med-hp); }
.chart rect.partial { fill: var(--med-muted); opacity: .35; }
.chart g.est { opacity: .45; }
.chart rect.sel { fill: rgba(255,255,255,.06); }
.chart rect.hit { fill: transparent; cursor: pointer; }
.days { display: grid; margin-top: 4px; }
.day { all: unset; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 4px 0; border-radius: 8px; font-size: .68rem; color: var(--med-muted); text-transform: capitalize; }
.day b { color: var(--med-text); font-size: .78rem; }
.day .dot { width: 6px; height: 6px; margin-top: 2px; }
.day.on { background: var(--med-surface); }
.day:focus-visible { outline: 2px solid var(--med-blue); }

.detail { margin: 8px 12px 0; padding: 10px 12px; border-radius: 12px; background: var(--med-surface); border: 1px solid var(--med-line); }
.detail-h { display: flex; align-items: center; gap: 8px; font-size: .8rem; color: var(--med-muted); }
.tag { padding: 1px 8px; border-radius: 999px; font-size: .72rem; font-weight: 700; color: #0f1724; }
.tag.t-blue { background: var(--t-blue); color: #fff; } .tag.t-white { background: var(--t-white); } .tag.t-red { background: var(--t-red); color: #fff; }
.detail-v { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; margin-top: 4px; font-size: .9rem; }
.sep { width: 1px; height: 12px; background: var(--med-line); }
.detail-p { font-size: .78rem; color: var(--med-muted); margin-top: 4px; }
.warn { color: var(--t-red); font-style: normal; font-weight: 600; }

.power { margin: 10px 12px 0; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--med-line); }
.power.is-over { border-color: var(--t-red); }
.power-t { display: flex; justify-content: space-between; font-size: .85rem; }
.gauge { height: 6px; border-radius: 6px; background: var(--med-line); margin: 8px 0 6px; overflow: hidden; }
.gauge i { display: block; height: 100%; background: linear-gradient(90deg, var(--med-green), var(--med-blue)); }
.is-over .gauge i { background: var(--t-red); }
.power-n { font-size: .75rem; color: var(--med-muted); }

.eco { margin: 10px 12px 0; padding: 8px 12px; border-radius: 12px; border: 1px solid var(--med-line); font-size: .82rem; display: flex; align-items: center; gap: 8px; }
.eco.e-ok .dot { background: var(--med-down); }
.eco.e-warn { border-color: #f0a33a; } .eco.e-warn .dot { background: #f0a33a; }
.eco.e-alert { border-color: var(--t-red); } .eco.e-alert .dot { background: var(--t-red); }
.eco-l { color: var(--med-muted); }
footer { padding: 10px 18px 14px; font-size: .7rem; color: var(--med-muted); }
.empty { padding: 18px; display: flex; flex-direction: column; gap: 6px; font-size: .9rem; }
.empty span { color: var(--med-muted); }
/* Thème Home Assistant : fond, textes et bordures suivent le thème clair ou sombre */
ha-card.th-ha {
  --med-bg: var(--ha-card-background, var(--card-background-color, #fff));
  --med-surface: color-mix(in srgb, var(--primary-text-color, #000) 5%, transparent);
  --med-line: var(--divider-color, rgba(127, 127, 127, .25));
  --med-text: var(--primary-text-color, #1f2937);
  --med-muted: var(--secondary-text-color, #6b7280);
  border-radius: var(--ha-card-border-radius, 12px);
  border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
}
ha-card.th-ha.light { --med-green: #4c8a0b; --med-up: #c2560f; --med-down: #1d8a4b; }
/* Style MyElectricalData en version claire (theme: auto quand Home Assistant est en mode clair) */
ha-card.th-v2.light {
  --med-bg: #ffffff; --med-surface: #f2f5f9; --med-line: #dbe2ec;
  --med-text: #1a2434; --med-muted: #5b6b82;
  --med-green: #4c8a0b; --med-blue: #1673b8; --med-up: #c2560f; --med-down: #1d8a4b;
  box-shadow: 0 1px 3px rgba(26, 36, 52, .08);
}
ha-card.light .k-hc { color: #2f5fb8; }
ha-card.light .k-hp { color: #b35619; }
ha-card.light .t-white .dot, ha-card.light .tag.t-white { box-shadow: inset 0 0 0 1px #aab3c0; }
ha-card.light .chart rect.sel { fill: rgba(0, 0, 0, .05); }
ha-card.light .tag.t-white { color: #1f2937; }
@media (max-width: 420px) { .hero-v { font-size: 2rem; } .tempo { width: 100%; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>`;

/* ----------------------------------------------------------------- éditeur */

const THEME_SELECT = {
  name: "theme",
  selector: {
    select: {
      mode: "dropdown",
      options: [
        { value: "v2", label: "Style MyElectricalData (bleu nuit)" },
        { value: "auto", label: "Style MyElectricalData, clair ou sombre selon Home Assistant" },
        { value: "ha", label: "Thème Home Assistant (clair ou sombre)" },
      ],
    },
  },
};

/** Éditeur visuel : formulaire Home Assistant construit à partir du schéma. */
function makeEditor(schema, labels, defaults) {
  const hasDays = schema.some((s) => s.name === "days");
  return class extends HTMLElement {
    setConfig(config) {
      this._config = { ...config };
      this._draw();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._form) this._form.hass = hass;
      else this._draw();
    }

    _draw() {
      if (!this._hass || !this._config) return;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => labels[s.name] || s.name;
        this._form.addEventListener("value-changed", (ev) => {
          const v = { ...ev.detail.value };
          if (hasDays && v.days !== undefined) v.days = Number(v.days);
          this._config = v;
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: v }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      this._form.schema = schema;
      this._form.data = hasDays
        ? { ...defaults, ...this._config, days: String(this._config.days || defaults.days) }
        : { ...defaults, ...this._config };
    }
  };
}

const SRV_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "subtitle", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "fan", selector: { entity: { domain: ["sensor", "fan"] } } },
  { name: "ram_total", selector: { number: { min: 128, max: 262144, mode: "box", unit_of_measurement: "MiB" } } },
  { name: "backup_title", selector: { text: {} } },
  { name: "navigation_path", selector: { text: {} } },
  { name: "net_max", selector: { number: { min: 1, max: 10000, mode: "box", unit_of_measurement: "Mbit/s" } } },
  { name: "temp_warn", selector: { number: { min: 30, max: 100, mode: "box", unit_of_measurement: "°C" } } },
  { name: "temp_alert", selector: { number: { min: 30, max: 110, mode: "box", unit_of_measurement: "°C" } } },
  { name: "show_info", selector: { boolean: {} } },
  { name: "show_resources", selector: { boolean: {} } },
  { name: "show_network", selector: { boolean: {} } },
  { name: "show_power", selector: { boolean: {} } },
  { name: "show_backup", selector: { boolean: {} } },
  THEME_SELECT,
];
const SRV_LABELS = {
  title: "Titre (ex. Raspberry Pi 4 4 Go)",
  subtitle: "Sous-titre",
  icon: "Icône de l'en-tête (ex. mdi:raspberry-pi)",
  icon_color: "Couleur de l'icône (ex. #E30B5D)",
  fan: "Ventilateur : entité fan.* ou capteur en rpm / % (facultatif)",
  ram_total: "RAM totale, pour la barre « RAM libre » (facultatif)",
  backup_title: "Titre de la section sauvegardes (facultatif)",
  navigation_path: "Page ouverte en cliquant sur le titre (facultatif)",
  net_max: "Pleine échelle des barres réseau",
  temp_warn: "Température : seuil orange",
  temp_alert: "Température : seuil rouge",
  show_info: "Section Informations",
  show_resources: "Section Ressources",
  show_network: "Section Débits réseau",
  show_power: "Section Alimentation",
  show_backup: "Section Sauvegardes",
  theme: "Couleurs de la carte",
};
const ServeurHaCardEditor = makeEditor(SRV_SCHEMA, SRV_LABELS, SRV_DEFAULTS);
const MAJ_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "subtitle", selector: { text: {} } },
  { name: "database", selector: { entity: { domain: "sensor" } } },
  { name: "ssl", selector: { entity: { domain: "sensor" } } },
  { name: "ssl_warn", selector: { number: { min: 1, max: 120, mode: "box", unit_of_measurement: "j" } } },
  { name: "ssl_alert", selector: { number: { min: 1, max: 120, mode: "box", unit_of_measurement: "j" } } },
  { name: "include_hacs", selector: { boolean: {} } },
  { name: "include_devices", selector: { boolean: {} } },
  { name: "updates_first", selector: { boolean: {} } },
  { name: "show_system", selector: { boolean: {} } },
  { name: "show_info", selector: { boolean: {} } },
  { name: "show_apps", selector: { boolean: {} } },
  THEME_SELECT,
];
const MAJ_LABELS = {
  title: "Titre",
  subtitle: "Sous-titre",
  database: "Taille de la base de données (facultatif, détectée sinon)",
  ssl: "Expiration du certificat SSL (facultatif, détectée sinon)",
  ssl_warn: "Certificat : orange en dessous de",
  ssl_alert: "Certificat : rouge en dessous de",
  include_hacs: "Ajouter les mises à jour HACS aux applications",
  include_devices: "Ajouter les firmwares d'appareils (Zigbee, ESPHome…)",
  updates_first: "Applications à mettre à jour en premier",
  show_system: "Section Mises à jour système",
  show_info: "Section Informations",
  show_apps: "Section Applications",
  theme: "Couleurs de la carte",
};
const ServeurHaMajCardEditor = makeEditor(MAJ_SCHEMA, MAJ_LABELS, MAJ_DEFAULTS);
const NAS_SCHEMA = [
  { name: "device", selector: { device: { integration: "synology_dsm" } } },
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "tracker", selector: { entity: { domain: "device_tracker" } } },
  { name: "ip", selector: { text: {} } },
  { name: "volume_name", selector: { text: {} } },
  { name: "fan", selector: { entity: { domain: "select" } } },
  { name: "shutdown", selector: { entity: { domain: "button" } } },
  { name: "power_on", selector: { entity: { domain: ["button", "switch", "script", "input_boolean"] } } },
  { name: "actions", selector: { entity: { domain: ["switch", "button", "input_boolean"], multiple: true } } },
  { name: "usb", selector: { entity: { domain: "sensor", multiple: true } } },
  { name: "ups_device", selector: { device: { integration: "nut" } } },
  { name: "ups_name", selector: { text: {} } },
  { name: "navigation_path", selector: { text: {} } },
  { name: "net_max", selector: { number: { min: 1, max: 100000, mode: "box", unit_of_measurement: "Mbit/s" } } },
  { name: "show_info", selector: { boolean: {} } },
  { name: "show_resources", selector: { boolean: {} } },
  { name: "show_thermal", selector: { boolean: {} } },
  { name: "show_actions", selector: { boolean: {} } },
  { name: "show_network", selector: { boolean: {} } },
  { name: "show_ups", selector: { boolean: {} } },
  THEME_SELECT,
];
const NAS_LABELS = {
  device: "NAS (appareil Synology DSM, facultatif)",
  title: "Titre (nom de l'appareil par défaut)",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  tracker: "Traceur réseau du NAS, pour l'adresse IP (facultatif)",
  ip: "Adresse IP du NAS, ou entité qui la porte (vide = traceur, sinon adresse de l'intégration Synology DSM)",
  volume_name: "Nom du volume 1 (ex. HDD 4 To)",
  fan: "Mode du ventilateur (select, facultatif)",
  shutdown: "Bouton d'arrêt du NAS (vide = bouton « Arrêter » de Synology DSM)",
  power_on: "Allumage du NAS : Wake on LAN, prise ou script (vide = Wake on LAN détecté)",
  actions: "Interrupteurs et boutons à afficher (prises, mini-PC…)",
  usb: "Disques USB : capteurs d'espace utilisé en % (vide = détectés dans Synology DSM)",
  ups_device: "Onduleur (appareil NUT, facultatif)",
  ups_name: "Nom de l'onduleur (facultatif)",
  navigation_path: "Page ouverte en cliquant sur le titre (facultatif)",
  net_max: "Pleine échelle des barres réseau",
  show_info: "Section Informations",
  show_resources: "Section Ressources",
  show_thermal: "Section Températures et ventilation",
  show_actions: "Section Actions",
  show_network: "Section Débits réseau",
  show_ups: "Section Onduleur",
  theme: "Couleurs de la carte",
};
const ServeurHaNasCardEditor = makeEditor(NAS_SCHEMA, NAS_LABELS, NAS_DEFAULTS);
const PVE_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "nodes", selector: { text: { multiple: true } } },
  { name: "protect", selector: { text: { multiple: true } } },
  { name: "sort", selector: { select: { mode: "dropdown", options: [
    { value: "status", label: "En marche d'abord" }, { value: "name", label: "Par nom" }, { value: "cpu", label: "Par CPU" }, { value: "ram", label: "Par RAM" }] } } },
  { name: "hide_stopped", selector: { boolean: {} } },
  { name: "show_node", selector: { boolean: {} } },
  { name: "show_storage", selector: { boolean: {} } },
  { name: "show_guests", selector: { boolean: {} } },
  { name: "show_actions", selector: { boolean: {} } },
  THEME_SELECT,
];
const PVE_LABELS = {
  title: "Titre",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  nodes: "Nœuds affichés (vide = tous)",
  protect: "Invités protégés : pas d'arrêt ni de redémarrage (vide = la VM Home Assistant, détectée par son nom)",
  sort: "Ordre des invités",
  hide_stopped: "Masquer les invités arrêtés",
  show_node: "Section Nœud",
  show_storage: "Section Stockage",
  show_guests: "Section Invités",
  show_actions: "Boutons démarrer, arrêter, redémarrer (deux clics)",
  theme: "Couleurs de la carte",
};
const ServeurHaProxmoxCardEditor = makeEditor(PVE_SCHEMA, PVE_LABELS, PVE_DEFAULTS);

/* ---------------------------------------------------------- enregistrement */

if (typeof customElements !== "undefined") {
  const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };
  define("serveur-ha-card", ServeurHaCard);
  define("serveur-ha-card-editor", ServeurHaCardEditor);
  define("serveur-ha-maj-card", ServeurHaMajCard);
  define("serveur-ha-maj-card-editor", ServeurHaMajCardEditor);
  define("serveur-ha-nas-card", ServeurHaNasCard);
  define("serveur-ha-nas-card-editor", ServeurHaNasCardEditor);
  define("serveur-ha-proxmox-card", ServeurHaProxmoxCard);
  define("serveur-ha-proxmox-card-editor", ServeurHaProxmoxCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "serveur-ha-card")) {
    window.customCards.push({
      type: "serveur-ha-card",
      name: "Carte Serveur HA",
      description: "CPU, température, RAM, disque, réseau, uptime, alimentation et sauvegardes du serveur Home Assistant.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-maj-card")) {
    window.customCards.push({
      type: "serveur-ha-maj-card",
      name: "Carte Home Assistant (mises à jour)",
      description: "Version et mises à jour Core / Supervisor / OS, base de données, certificat SSL et applications.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-nas-card")) {
    window.customCards.push({
      type: "serveur-ha-nas-card",
      name: "Carte NAS Synology",
      description: "Santé des volumes et disques, CPU, RAM, températures, ventilateur, actions, réseau et onduleur d'un NAS Synology.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-proxmox-card")) {
    window.customCards.push({
      type: "serveur-ha-proxmox-card",
      name: "Carte Proxmox VE",
      description: "Nœuds, stockages, VM et conteneurs Proxmox VE : état, CPU, RAM, uptime, mises à jour, démarrage et arrêt confirmés.",
      preview: true,
    });
  }
  console.info(`%c SERVEUR-HA-CARD %c ${CARD_VERSION} `, "background:#96d21f;color:#1a2434;font-weight:700", "background:#1d93e3;color:#fff");
}
})();
