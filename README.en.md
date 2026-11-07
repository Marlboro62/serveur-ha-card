# Home Assistant Server Cards — English Documentation

[Français](README.md) | **English** | [Polski](README.pl.md)

A collection of **14 independent Home Assistant Lovelace cards in one JavaScript resource**. Built in the visual style of MyElectricalData, with a midnight-blue design and optional light or Home Assistant native theming.

**This build supports French, English and Polish.** All cards have a shared `language` option. The default `auto` follows your Home Assistant interface language: French for `fr` locales, Polish for `pl` locales, and English for other locales. You can override the language on each card. The existing French user interface and entity-detection logic are preserved.

## Cards

| Card type | What it displays |
| --- | --- |
| `custom:serveur-ha-card` | Home Assistant host / Raspberry Pi / mini-PC: CPU, temperature, RAM, disks, network, uptime, fan, power supply and backups |
| `custom:serveur-ha-maj-card` | Home Assistant: Core, Supervisor, OS and add-on updates, database size and SSL certificate expiry |
| `custom:serveur-ha-nas-card` | Synology NAS: volumes, SMART / disk health, CPU, RAM, temperatures, fan, network, power actions and UPS |
| `custom:serveur-ha-dns-card` | AdGuard Home and Pi-hole: DNS requests, blocking percentage, response times, protection, switches, pauses and updates |
| `custom:serveur-ha-linux-card` | Linux Update Dashboard: outstanding system/security updates, pending packages, reboot status and confirmed updates |
| `custom:serveur-ha-proxmox-card` | Proxmox VE: nodes, storage, VMs, LXC containers, updates and confirmed power actions |
| `custom:serveur-ha-asus-card` | AsusRouter: Internet and public IP, Wi-Fi, Ethernet ports, clients, VPN, firmware, temperatures and restart |
| `custom:serveur-ha-ping-card` | Ping/ICMP monitoring: online/offline devices, latency, jitter and packet loss, grouped by type or area |
| `custom:serveur-ha-zigbee-card` | Zigbee/ZHA/Zigbee2MQTT: low and critical batteries, offline devices, link quality and bridge status |
| `custom:serveur-ha-wireguard-card` | WireGuard WGDashboard: servers, connected peers, handshakes, traffic received and sent |
| `custom:serveur-ha-glances-card` | Glances: host CPU, RAM, disks, temperatures, fans, network and processes |
| `custom:serveur-ha-media-card` | Plex, Jellyfin and Emby: current playback, active players, player controls, media libraries and server updates |
| `custom:serveur-ha-omv-card` | OpenMediaVault: uptime, CPU, RAM, disks and SMART health, file systems, services, network and power actions |
| `custom:serveur-ha-github-card` | GitHub (beta): open issues and pull requests by repository; indicates newly created items |

The separate OPNsense card has moved to its own repository: [opnsense-card](https://github.com/Marlboro62/opnsense-card). The old tag displays a migration message.

## Installation

### HACS

1. In **HACS**, find **Cartes Serveur HA** and install it.
2. Refresh the Home Assistant frontend (`Ctrl+F5`).
3. If the repository is not listed, use **HACS → ⋮ → Custom repositories**, enter `https://github.com/Marlboro62/serveur-ha-card`, and choose **Dashboard**. Install the card, then refresh.

For a local modified JavaScript file, manual installation may be more appropriate unless the changes have been published to the repository.

### Manual installation

1. Copy `serveur-ha-card.js` into `/config/www/`.
2. In **Settings → Dashboards → ⋮ → Resources**, add `/local/serveur-ha-card.js` as **JavaScript module**.
3. Refresh the browser cache (`Ctrl+F5`).

Do not load both the HACS-managed and manually installed versions simultaneously under different resource URLs, as they register the same custom elements.

## Languages / localization

The **Language** field is available in the visual editor for *each card*. Alternatively use `language` in YAML:

```yaml
type: custom:serveur-ha-card
language: auto     # Home Assistant UI language (default)
```

Force English:

```yaml
type: custom:serveur-ha-nas-card
language: en
```

Force French:

```yaml
type: custom:serveur-ha-proxmox-card
language: fr
```

Force Polish:

```yaml
type: custom:serveur-ha-card
language: pl
```

- `auto` (or omitting the setting): use the Home Assistant UI language; `fr` locales use French, `pl` locales use Polish, and other languages use English as a fallback.
- `en`: English labels, statuses, tooltips, visual editor, number and date formatting (UK English locale).
- `fr`: existing French labels, statuses, tooltips, visual editor and number/date formatting.
- `pl`: Polish labels, statuses, tooltips, visual editor and Polish number/date formatting (`pl-PL`).
- Each card can use a different language. A change to the Home Assistant interface language is reflected in cards using `auto` on their next update.
- **Sensor and entity discovery is not tied to the display language**. Existing French and English entity identifiers continue to be recognized.

## Common options

| Option | Description | Default |
| --- | --- | --- |
| `language` | `auto`, `en`, `fr` or `pl` | `auto` |
| `theme` | `v2` (midnight blue), `auto` (light/dark with HA), `ha` (use Home Assistant colors) | `v2` |
| `text_size` | Scale the whole card, from 70% to 200% | `100` |
| `title` | Custom title (where supported) | Card-specific |
| `icon`, `icon_color` | Header icon and color (where supported) | Card-specific |

Example:

```yaml
type: custom:serveur-ha-dns-card
language: en
theme: auto
text_size: 110
```

## Quick-start examples

**Host monitoring:**

```yaml
type: custom:serveur-ha-card
title: Raspberry Pi 4
language: en
icon: mdi:raspberry-pi
ram_total: 3800
show_info: true
show_resources: true
show_network: true
show_power: true
show_backup: true
```

The card discovers supported sensors from System Monitor, Local IP, Uptime, Raspberry Pi Power Supply Checker, backup events, and Google Drive Backup. System Monitor sensors may require enabling in **Settings → Devices & services → System Monitor**.

**Home Assistant updates:**

```yaml
type: custom:serveur-ha-maj-card
language: en
include_hacs: false
include_devices: false
updates_first: true
```

**Synology NAS:**

```yaml
type: custom:serveur-ha-nas-card
language: en
volume_name: HDD 4 TB
net_max: 1000
```

Install and configure the Synology DSM integration first. NAS/UPS entities are discovered automatically; use options such as `device`, `tracker`, `fan`, `ups_device` or `power_on` to override the defaults.

**Proxmox VE:**

```yaml
type: custom:serveur-ha-proxmox-card
language: en
nodes: [pve1, pve2]
protect: [home-assistant]
sort: status
```

Requires the Proxmox VE integration in Home Assistant. Stopping a Proxmox container may be an immediate stop rather than a graceful shutdown; use the intended shutdown procedure for systems that write to disk. The card protects the Home Assistant guest by default.

**Linux updates:**

```yaml
type: custom:serveur-ha-linux-card
language: en
show_uptodate: true
show_packages: true
show_actions: true
```

Uses the `update.*` entities provided via MQTT by Linux Update Dashboard.

**Network and Zigbee monitoring:**

```yaml
type: custom:serveur-ha-ping-card
language: en
group_by: auto
```

```yaml
type: custom:serveur-ha-zigbee-card
language: en
warn: 40
alert: 20
```

**DNS filtering:**

```yaml
type: custom:serveur-ha-dns-card
language: en
theme: ha
show_stats: true
show_details: true
show_switches: true
```

The card uses the Home Assistant AdGuard Home and/or Pi-hole integration, not credentials stored in the frontend.

**Media servers:**

```yaml
type: custom:serveur-ha-media-card
language: en
show_libraries: true
show_controls: true
show_details: true
```

Configure Plex, Jellyfin or Emby integration in Home Assistant first.

**GitHub beta:**

```yaml
type: custom:serveur-ha-github-card
language: en
user: Marlboro62
refresh: 15
max_items: 30
```

The card retrieves public issues/pull requests. GitHub API rate limits may apply.

## Notes

- No dependency on `button-card` or `browser_mod`; no extra assets need to be copied into `/local`.
- Most data is read from entities already exposed to Home Assistant. Elements without matching entities are hidden.
- Existing YAML configuration and French UI remain supported.
- See [README.md](README.md) for the complete original French reference, per-card options, and more examples.

**Project:** [Marlboro62/serveur-ha-card](https://github.com/Marlboro62/serveur-ha-card).
