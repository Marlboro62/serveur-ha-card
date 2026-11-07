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
 *   custom:serveur-ha-omv-card   OpenMediaVault : système, systèmes de fichiers, disques (SMART),
 *                                services, réseau, redémarrage et arrêt confirmés en deux clics
 *   custom:serveur-ha-dns-card   Filtrage DNS (AdGuard Home ou Pi-hole) : requêtes, part bloquée,
 *                                temps de réponse, protection et réglages, mises à jour
 *   custom:serveur-ha-zigbee-card  Zigbee et piles : piles à changer, appareils hors ligne,
 *                                signal faible ou silencieux, pont Zigbee2MQTT
 *
 * Capteurs détectés automatiquement, ou choisis dans la configuration (voir le README).
 */

(() => {
const CARD_VERSION = "0.17.2-fr-en-pl";

/* ------------------------------------------------------------- i18n FR/EN/PL
 * Source strings and sensor matching remain unchanged.  Only presentation
 * text in the card shadow DOM and the Home Assistant editor is localized.
 * 'auto' follows the Home Assistant UI language (fr/pl/en); other
 * HA languages fall back to English.  The existing French presentation remains the FR source of truth.
 */
let CURRENT_CARD_LANGUAGE = "fr";
const cardLanguage = (config, hass) => {
  const explicit = String(config?.language || "auto").toLowerCase().split("-")[0];
  if (["fr", "en", "pl"].includes(explicit)) return explicit;
  const haLanguage = String(hass?.locale?.language || hass?.language || "fr").toLowerCase();
  return haLanguage.startsWith("fr") ? "fr" : haLanguage.startsWith("pl") ? "pl" : "en";
};
const cardLocale = () => CURRENT_CARD_LANGUAGE === "en" ? "en-GB" : CURRENT_CARD_LANGUAGE === "pl" ? "pl-PL" : "fr-FR";

const EN_TEXT = {
  // Shared card sections, statuses, commands and units
  "Serveur": "Server", "Serveurs": "Servers", "Serveur Home Assistant": "Home Assistant server",
  "Serveur domotique": "Home automation server", "Serveurs multimédia": "Media servers",
  "Réseau": "Network", "Réseaux": "Networks", "Réseau local": "Local network", "Réception": "Download",
  "Envoi": "Upload", "Envoyé": "Sent", "Reçu": "Received", "Débits réseau": "Network traffic",
  "Débits": "Traffic", "Débit": "Speed", "Bande passante": "Bandwidth", "Trafic": "Traffic",
  "Ressources": "Resources", "Informations": "Information", "Information": "Information",
  "Adresses IP": "IP addresses", "Adresse IP": "IP address", "Interne": "Internal", "Externe": "External",
  "IP publique": "Public IP", "Connexion": "Connection", "Connexions": "Connections",
  "Système": "System", "Systèmes": "Systems", "Systèmes de fichiers": "File systems",
  "Disques": "Disks", "Disque": "Disk", "Disques USB": "USB drives", "Stockage": "Storage",
  "Températures": "Temperatures", "Température": "Temperature", "Ventilation": "Cooling",
  "Températures et ventilation": "Temperatures and cooling", "Ventilateur": "Fan", "Ventilateurs": "Fans",
  "Alimentation": "Power supply", "Sous-tension détectée : vérifiez l'alimentation": "Undervoltage detected: check the power supply",
  "État de l'alimentation sur 24 h": "Power supply status over 24 hours",
  "Historique de l'alimentation sur 24 heures": "24-hour power supply history",
  "Historique indisponible": "History unavailable", "Chargement de l'historique…": "Loading history…",
  "Sauvegardes": "Backups", "Sauvegarde": "Backup", "Sauvegarde…": "Backing up…",
  "Réception…": "Receiving…", "Restauration…": "Restoring…",
  "Dernière": "Latest", "Dernière sauvegarde": "Last backup", "Prochaine": "Next",
  "État": "Status", "Statut": "Status", "Version": "Version", "Dispo": "Available",
  "État des disques": "Disk health", "Santé": "Health", "Sécurité": "Security",
  "Sécurisé": "Secure", "Alerte": "Alert", "Alertes": "Alerts", "Normal": "Normal",
  "Dégradé": "Degraded", "En panne": "Failed", "Défaillant": "Failing",
  "Avertissement": "Warning", "Attention": "Attention", "Initialisé": "Initialized",
  "Non initialisé": "Not initialized", "Partition système en échec": "System partition failed",
  "Réparation…": "Repairing…", "Sur batterie": "On battery", "Secteur": "Mains power",
  "Secteur · en charge": "On mains · charging", "Batterie faible": "Low battery",
  "Batterie à remplacer": "Replace battery", "Surcharge": "Overload", "Onduleur": "UPS",
  "Secteurs défectueux": "Bad sectors", "Erreurs CRC": "CRC errors", "Durée de vie": "Lifespan",
  "Mise à jour": "Update", "Mises à jour": "Updates", "Mises à jour système": "System updates",
  "Redémarrage requis": "Restart required", "redémarrage requis": "restart required",
  "À jour": "Up to date", "à jour": "up to date", "À installer": "Pending installation",
  "Applications": "Applications", "Application": "Application", "Détails": "Details",
  "Services": "Services", "Actions": "Actions", "Réglages": "Settings", "Paramètres": "Settings",
  "Paquets": "Packages", "Paquet": "Package", "Paquets en attente": "Pending packages",
  "Système d'exploitation": "Operating system", "Noyau": "Kernel",
  "Nœuds": "Nodes", "Nœud": "Node", "Invités": "Guests", "Invité": "Guest",
  "VM et conteneurs": "VMs and containers", "Conteneurs": "Containers",
  "Tout démarrer": "Start all", "Démarrer": "Start", "Redémarrer": "Restart",
  "Arrêter": "Stop", "Éteindre": "Power off", "Allumer": "Power on",
  "Veille": "Standby", "Redémarrer le Wi-Fi": "Restart Wi-Fi",
  "Éteindre les LED": "Turn LEDs off", "Allumer les LED": "Turn LEDs on",
  "Arrêt": "Stop", "Lecture": "Play", "Pause": "Pause", "Reprendre": "Resume",
  "Précédent": "Previous", "Suivant": "Next", "Volume": "Volume", "Muet": "Muted",
  "Confirmer": "Confirm", "Confirmer ?": "Confirm?", "Annuler": "Cancel",
  "Appui long : marche / arrêt": "Long press: on / off",
  "Afficher l'état des disques": "Show disk health",
  "Protégé : pas d'arrêt ni de redémarrage depuis la carte": "Protected: cannot stop or restart from this card",
  "En ligne": "Online", "en ligne": "online", "Hors ligne": "Offline", "hors ligne": "offline",
  "Connecté": "Connected", "connecté": "connected", "Connectés": "Connected",
  "Déconnecté": "Disconnected", "déconnecté": "disconnected",
  "Activé": "Enabled", "activé": "enabled", "Désactivé": "Disabled", "désactivé": "disabled",
  "Éteint": "Off", "éteint": "off", "Éteinte": "Off", "Allumé": "On", "allumé": "on",
  "Arrêté": "Stopped", "arrêté": "stopped", "En marche": "Running", "en marche": "running",
  "à l'arrêt": "stopped", "En cours": "In progress", "en cours": "in progress",
  "Inactif": "Idle", "Indisponible": "Unavailable", "indisponible": "unavailable",
  "Inconnu": "Unknown", "inconnu": "unknown", "Jamais connecté": "Never connected",
  "Terminé": "Completed", "Échoué": "Failed", "Échec": "Failure", "Bloqué": "Blocked",
  "en erreur": "error", "OK": "OK", "Oui": "Yes", "Non": "No",
  "Tout va bien": "All good", "Tout est traité": "All handled", "Rien d'ouvert : tout est traité.": "Nothing open: all handled.",
  "aucun": "none", "Aucun": "None", "Aucune": "None", "Tous": "All", "Toutes": "All",
  "Filtres": "Filters", "Filtrage DNS": "DNS filtering", "Requêtes": "Queries",
  "Bloquées": "Blocked", "bloqué": "blocked", "Blocage": "Blocking",
  "Blocage désactivé": "Blocking disabled", "Protection": "Protection",
  "Protection désactivée": "Protection disabled", "Protection activée": "Protection enabled",
  "Domaines bloqués": "Blocked domains", "Règles": "Rules", "Transférées": "Forwarded",
  "Contrôle parental": "Parental controls", "Navigation sécurisée": "Safe browsing",
  "Recherches sécurisées": "Safe search", "Temps de réponse": "Response time",
  "Réponse": "Response", "Internet bloqué": "Internet blocked", "Internet coupé": "Internet disconnected",
  "Wi-Fi invités": "Guest Wi-Fi", "Invités": "Guests", "Ports": "Ports", "Ports Ethernet": "Ethernet ports",
  "Appareils connectés": "Connected devices", "Appareils": "Devices", "Appareil": "Device",
  "Dernières connexions": "Recent connections", "Connexions récentes": "Recent connections",
  "Tous les appareils": "All devices", "Filaire": "Wired", "Invités": "Guests",
  "Aucun réseau invité actif": "No active guest network", "Débits par bande": "Per-band traffic",
  "Voir tous": "View all", "Réduire": "Collapse", "Déplier": "Expand",
  "Piles": "Batteries", "Pile": "Battery", "Piles à changer": "Replace batteries",
  "Piles faibles": "Low batteries", "Piles en bon état": "Healthy batteries",
  "Sur secteur": "Mains powered", "Pont": "Bridge", "Zigbee et piles": "Zigbee and batteries",
  "Pont Zigbee2MQTT déconnecté : aucun appareil Zigbee ne répond.": "Zigbee2MQTT bridge disconnected: no Zigbee device responds.",
  "Qualité du lien": "Link quality", "Dernière nouvelle": "Last seen",
  "À surveiller": "Needs attention", "à surveiller": "need attention",
  "À traiter": "Needs action", "à traiter": "need action", "Signal faible": "Weak signal",
  "Faible": "Low", "faible": "low", "Silencieux": "Quiet", "Frais": "Cool",
  "Vitesse max": "Full speed", "Économie": "Eco",
  "Raspberry Pi": "Raspberry Pi", "Suivis": "Monitored", "suivis": "monitored",
  "Serveurs Linux": "Linux servers", "Mettre à jour": "Update now",
  "Installer les mises à jour": "Install updates", "Tous les serveurs sont à jour.": "All servers are up to date.",
  "mise à jour en cours…": "update in progress…", "tous à jour": "all up to date",
  "tout est à jour": "everything is up to date",
  "Sécurité et redémarrage": "Security and restart",
  "Dernier handshake": "Last handshake", "Pairs": "Peers", "Pair": "Peer",
  "pairs connectés": "connected peers", "Aucun pair connecté": "No connected peers",
  "Handshake": "Handshake", "Jamais": "Never", "Vu": "Seen", "Point d'accès": "Endpoint",
  "Reçu par le serveur": "Received by server", "Envoyé par le serveur": "Sent by server",
  "reçu": "received", "envoyé": "sent",
  "Serveurs Glances": "Glances servers", "Mémoire": "Memory", "RAM libre": "Free RAM",
  "Processus": "Processes", "processus": "processes", "Charge": "Load",
  "Médias": "Media", "Multimédia": "Media", "Bibliothèques": "Libraries", "Bibliothèque": "Library",
  "Lecteurs": "Players", "Lecteur": "Player", "Films": "Movies", "Séries": "TV shows",
  "Musique": "Music", "En lecture": "Playing", "en lecture": "playing", "Rien en lecture": "Nothing playing",
  "En pause": "Paused", "en pause": "paused", "Lecture en cours": "Now playing",
  "Épisode": "Episode", "Saison": "Season", "Artiste": "Artist", "Titre": "Title",
  "Résumé": "Summary", "Commandé par": "Controlled by", "Durée": "Duration",
  "Parcourir": "Browse", "Lire": "Play", "Lecture aléatoire": "Shuffle",
  "Minuteur": "Timer", "Minuteur de veille": "Sleep timer", "Aucun lecteur": "No player",
  "Nouvelle": "New", "Nouvelles": "New", "nouvelle": "new", "nouvelles": "new",
  "ouverte": "open", "ouvertes": "open", "Ouvert": "Open",
  "brouillon": "draft", "activité": "activity", "Activité": "Activity",
  "Dépôts": "Repositories", "Dépôt": "Repository", "dépôt": "repository", "dépôts": "repositories",
  "Issues et pull requests": "Issues and pull requests", "Actualiser": "Refresh",
  "Lu": "Checked", "à l'instant": "just now", "Nombre": "Count",
  "Compte GitHub à indiquer": "GitHub account required",
  "En marche d'abord": "Running first", "Par nom": "By name", "Par CPU": "By CPU", "Par RAM": "By RAM",
  "Par type d'appareil (d'après le nom)": "By device type (inferred from name)",
  "Par pièce": "By room", "Une seule liste": "Single list",
  "Téléphones et ordinateurs": "Phones and computers", "Imprimantes": "Printers", "Domotique": "Smart home",
  "Tous les appareils à pile, et les appareils Zigbee": "All battery-powered and Zigbee devices",
  "Appareils Zigbee seulement (Zigbee2MQTT, ZHA)": "Zigbee devices only (Zigbee2MQTT, ZHA)",
  "Issues seulement": "Issues only", "Pull requests seulement": "Pull requests only",
  "Style MyElectricalData (bleu nuit)": "MyElectricalData style (midnight blue)",
  "Style MyElectricalData, clair ou sombre selon Home Assistant": "MyElectricalData style, light or dark based on Home Assistant",
  "Thème Home Assistant (clair ou sombre)": "Home Assistant theme (light or dark)",
  "Limite de GitHub atteinte : nouvel essai à": "GitHub rate limit reached: retry at",
  "Erreur": "Error", "Erreur de connexion": "Connection error",
  "Sélectionner": "Select", "Choisir": "Choose",
  "Historique": "History", "Dernier": "Last", "Dernière": "Last",
  "Base de données": "Database", "Certificat SSL": "SSL certificate",
  "expire le": "expires on", "expiré": "expired", "encore": "remaining",
  "installation…": "installing…", "disponible": "available",
  "sur": "of", "depuis": "since", "il y a": "ago", "dans": "in",
  "moins d'une minute": "less than a minute", "j": "d", "Go": "GB", "To": "TB", "Mo": "MB",
  "n°": "#",
  // Full messages for empty states and helpful hints
  "Aucun capteur trouvé": "No sensors found",
  "Ajoutez l'intégration System Monitor (Paramètres → Appareils et services) ou indiquez vos capteurs dans": "Add the System Monitor integration (Settings → Devices & services), or specify your sensors under",
  "(voir le README).": "(see README).",
  "Aucun nœud Proxmox VE trouvé": "No Proxmox VE nodes found",
  "Ajoutez l'intégration Proxmox VE (Paramètres › Appareils et services), puis rechargez la page.": "Add the Proxmox VE integration (Settings › Devices & services), then reload the page.",
  "Aucun OpenMediaVault trouvé": "No OpenMediaVault system found",
  "Aucun routeur ASUS trouvé": "No ASUS router found",
  "Aucun appareil suivi par Ping": "No Ping-monitored devices found",
  "Ajoutez l'intégration Ping (ICMP) pour chaque appareil dans Paramètres › Appareils et services, puis rechargez la page.": "Add the Ping (ICMP) integration for each device in Settings › Devices & services, then reload the page.",
  "Aucun appareil à pile ni appareil Zigbee trouvé": "No battery-powered or Zigbee devices found",
  "Aucun serveur WireGuard trouvé": "No WireGuard server found",
  "Aucun serveur Glances trouvé": "No Glances server found",
  "Aucun serveur multimédia trouvé": "No media server found",
  "Ajoutez l'intégration Plex, Jellyfin ou Emby dans Paramètres › Appareils et services, puis rechargez la page.": "Add the Plex, Jellyfin or Emby integration under Settings › Devices & services, then reload the page.",
  "Aucun serveur AdGuard Home ni Pi-hole trouvé": "No AdGuard Home or Pi-hole server found",
  "Ajoutez l'intégration AdGuard Home ou Pi-hole (Paramètres › Appareils et services), puis rechargez la page.": "Add the AdGuard Home or Pi-hole integration (Settings › Devices & services), then reload the page.",
  "Aucun serveur trouvé": "No server found",
  "Aucune mise à jour": "No updates",
  "Aucun équipement": "No equipment",
  "Cette carte lit les entités": "This card reads entities",
  "Indiquez-les dans": "Specify them under",
  "si besoin.": "if needed.",
  "La carte OPNsense a déménagé": "The OPNsense card has moved",
  "Elle a maintenant son propre dépôt : installez « Carte OPNsense » depuis HACS": "It now has its own repository: install 'OPNsense Card' from HACS",
  "(dépôt personnalisé": "(custom repository",
  "puis remplacez": "then replace",
  "par": "with", "dans ce tableau de bord.": "in this dashboard.",
  "Les options restent les mêmes.": "The options remain the same.",
};

// Less frequent card-specific labels, explanatory text and tooltips.
Object.assign(EN_TEXT, {
  "Routeur ASUS": "ASUS router", "Routeurs ASUS": "ASUS routers",
  "publiées en MQTT par": "published over MQTT by",
  "publiées en MQTT": "published over MQTT",
  "suivi par Ping": "monitored by Ping", "suivis par Ping": "monitored by Ping",
  "suivi": "monitored", "suivis": "monitored",
  "par": "by",
  "Aucune entité trouvée": "No entities found",
  "Aucune entité Synology trouvée": "No Synology entities found",
  "Cette carte lit les entités": "This card reads entities",
  "de Home Assistant (intégration Supervisor). Indiquez-les dans": "from Home Assistant (Supervisor integration). Configure them under",
  "et": "and", "si besoin (voir le README).": "if needed (see README).",
  "NAS indisponible": "NAS unavailable", "NAS disponible": "NAS available",
  "Ajoutez l'intégration Synology DSM, ou indiquez le préfixe de vos entités (": "Add the Synology DSM integration or provide your entity prefix (",
  ") dans la configuration.": ") in the configuration.",
  "Appui long : mode suivant": "Long press: next mode",
  "Machine virtuelle": "Virtual machine", "Conteneur LXC": "LXC container",
  "Actions du nœud": "Node actions",
  "Redémarrage et arrêt masqués : ce nœud fait tourner Home Assistant.": "Restart and shutdown are disabled: this node hosts Home Assistant.",
  "cliquez encore pour confirmer": "click again to confirm",
  "Cliquez encore pour couper": "Click again to disable",
  "Cliquer pour couper": "Click to disable", "Cliquer pour activer": "Click to enable",
  "Couper le blocage pendant": "Disable blocking for",
  "Installer les mises à jour": "Install updates", "les paquets": "packages",
  "Masquer": "Hide", "Voir": "Show", "Voir les paquets": "Show packages",
  "Masquer les paquets": "Hide packages", "Confirmer :": "Confirm:",
  "Installez l'intégration OpenMediaVault (HACS, dépôt SlyBase/homeassistant-openmediavault), ajoutez-la dans Paramètres › Appareils et services, puis rechargez la page.": "Install the OpenMediaVault integration (HACS, SlyBase/homeassistant-openmediavault repository), add it in Settings › Devices & services, then reload the page.",
  "Installez l'intégration AsusRouter (HACS, dépôt Vaskivskyi/ha-asusrouter), ajoutez-la dans Paramètres › Appareils et services, puis rechargez la page.": "Install the AsusRouter integration (HACS, Vaskivskyi/ha-asusrouter repository), add it in Settings › Devices & services, then reload the page.",
  "Voir les appareils": "View devices", "Voir les dernières connexions": "View recent connections",
  "Aucun VPN actif": "No active VPN", "Connecté,": "Connected,", "connecté,": "connected,",
  "déconnecté": "disconnected", "Invités": "Guests", "LAN connectés": "LAN connected",
  "depuis le démarrage": "since boot", "Dernières connexions": "Recent connections",
  "Réduire": "Collapse", "Afficher": "Show", "Aucun appareil": "No devices",
  "latence moyenne": "average latency", "perte de paquets": "packet loss", "Tout en ligne": "All online",
  "éteint (volontairement)": "off (intentionally)", "Éteint (volontairement)": "Off (intentionally)",
  "La carte lit les capteurs de batterie (en %) de vos appareils, et les appareils Zigbee2MQTT ou ZHA. Vérifiez que leurs capteurs de batterie sont activés.": "The card reads your device battery percentage sensors and Zigbee2MQTT or ZHA devices. Make sure their battery sensors are enabled.",
  "pile faible": "low battery", "piles faibles": "low batteries", "piles": "batteries", "pile": "battery",
  "plus faible": "lowest", "aucune pile": "no batteries",
  "signal faible ou silencieux": "weak signal or silent", "Signal faible ou silencieux": "Weak signal or silent",
  "Qualité du lien": "Link quality", "Dernière nouvelle": "Last seen",
  "Dernière nouvelle il y a": "Last seen", "en ligne": "online",
  "Installez l'intégration WGDashboard Monitor (HACS) et ajoutez votre WGDashboard dans Paramètres › Appareils et services, puis rechargez la page.": "Install the WGDashboard Monitor integration (HACS), add WGDashboard under Settings › Devices & services, then reload the page.",
  "Handshake il y a": "Last handshake", "Vu il y a": "Last seen",
  "Installez Glances (mode web, glances -w) sur vos serveurs, puis ajoutez l'intégration Glances dans Paramètres › Appareils et services.": "Install Glances (web mode, glances -w) on your servers, then add the Glances integration under Settings › Devices & services.",
  "Retour à la liste": "Back to list", "Voir la fiche": "View details", "Fiche de": "Details for",
  "Voir le contenu": "Browse contents", "Ouvrir": "Open", "Retour": "Back", "Fermer": "Close",
  "Rechercher…": "Search…", "Rechercher": "Search", "Rien à afficher.": "Nothing to display.",
  "Aucun lecteur allumé : allumez la TV et ouvrez Plex pour lancer une lecture.": "No active player: turn on the TV and open Plex to start playback.",
  "Reprendre la lecture (par Plex)": "Resume playback (via Plex)",
  "Reprendre la lecture": "Resume playback", "Voir les lecteurs": "Show players",
  "Veille dans": "Sleep in", "Aucune lecture": "Nothing playing",
  "Volume du lecteur": "Player volume", "Mise en veille": "Going to sleep",
  "lecture en cours": "currently playing", "Rien en lecture": "Nothing playing",
  "Nombre de lecteurs": "Player count",
  "Installer les mises à jour": "Install updates",
  "(Paramètres → Notifications → MQTT, avec l'option Home Assistant). Indiquez-les dans": "(Settings → Notifications → MQTT, with the Home Assistant option). Specify them under",
  "Compte GitHub à indiquer": "GitHub account required",
  "En marche d'abord": "Running first", "Par nom": "By name", "Par CPU": "By CPU", "Par RAM": "By RAM",
  "Par type d'appareil (d'après le nom)": "By device type (inferred from name)",
  "Par pièce": "By room", "Une seule liste": "Single list",
  "Téléphones et ordinateurs": "Phones and computers", "Imprimantes": "Printers", "Domotique": "Smart home",
  "Tous les appareils à pile, et les appareils Zigbee": "All battery-powered and Zigbee devices",
  "Appareils Zigbee seulement (Zigbee2MQTT, ZHA)": "Zigbee devices only (Zigbee2MQTT, ZHA)",
  "Issues seulement": "Issues only", "Pull requests seulement": "Pull requests only",
  "Style MyElectricalData (bleu nuit)": "MyElectricalData style (midnight blue)",
  "Style MyElectricalData, clair ou sombre selon Home Assistant": "MyElectricalData style, light or dark based on Home Assistant",
  "Thème Home Assistant (clair ou sombre)": "Home Assistant theme (light or dark)",
  "Choisissez le compte ou l'organisation à suivre dans l'éditeur (option": "Choose the account or organization to follow in the editor (option",
  "), par exemple": "), for example",
  "Tout marquer comme vu": "Mark all as seen", "Relire maintenant": "Check again now",
  "commentaire": "comment", "commentaires": "comments",
  "Aucune issue": "No issues", "Dépôts": "Repositories",
  "Actualiser": "Refresh", "Lu": "Checked", "dépôt personnalisé": "custom repository",
  "blocage en cours": "blocking active", "Activé": "Enabled",
  "Aucun filtre": "No filter", "Dernière analyse": "Last analysis",
  "Certificat": "Certificate", "Installez": "Install", "Ajoutez": "Add",
  "Enregistrer": "Save", "Télécharger": "Download",
  "Télécharger les mises à jour": "Download updates",
  "en attente": "pending", "à installer": "to install",
  "Source": "Source", "Total": "Total", "Batterie": "Battery",
  "Sortie": "Output", "Entrée": "Input", "Réseaux invités": "Guest networks",
  "Appareils sans connexion": "Disconnected devices", "Événements": "Events",
  "Temps réel": "Real time", "Requêtes bloquées": "Blocked requests",
});

/* --------------------------------------------------------- Polish localization
 * Source language remains French.  Polish presentation is built from the
 * original French messages; configuration keys, entity IDs and services are
 * deliberately never translated.
 */
const PL_TEXT = {
  "Serveur": "Serwer",
  "Serveurs": "Serwery",
  "Serveur Home Assistant": "Serwer Home Assistant",
  "Serveur domotique": "Serwer automatyki domowej",
  "Serveurs multimédia": "Serwery multimediów",
  "Réseau": "Sieć",
  "Réseaux": "Sieci",
  "Réseau local": "Sieć lokalna",
  "Réception": "Pobieranie",
  "Envoi": "Wysyłanie",
  "Envoyé": "Wysłano",
  "Reçu": "Odebrano",
  "Débits réseau": "Ruch sieciowy",
  "Débits": "Transfery",
  "Débit": "Transfer",
  "Bande passante": "Przepustowość",
  "Trafic": "Ruch",
  "Ressources": "Zasoby",
  "Informations": "Informacje",
  "Information": "Informacja",
  "Adresses IP": "Adresy IP",
  "Adresse IP": "Adres IP",
  "Interne": "Wewnętrzny",
  "Externe": "Zewnętrzny",
  "IP publique": "Publiczny adres IP",
  "Connexion": "Połączenie",
  "Connexions": "Połączenia",
  "Système": "System",
  "Systèmes": "Systemy",
  "Systèmes de fichiers": "Systemy plików",
  "Disques": "Dyski",
  "Disque": "Dysk",
  "Disques USB": "Dyski USB",
  "Stockage": "Pamięć masowa",
  "Températures": "Temperatury",
  "Température": "Temperatura",
  "Ventilation": "Chłodzenie",
  "Températures et ventilation": "Temperatury i chłodzenie",
  "Ventilateur": "Wentylator",
  "Ventilateurs": "Wentylatory",
  "Alimentation": "Zasilanie",
  "Sous-tension détectée : vérifiez l'alimentation": "Wykryto zbyt niskie napięcie: sprawdź zasilanie",
  "État de l'alimentation sur 24 h": "Stan zasilania z ostatnich 24 godz.",
  "Historique de l'alimentation sur 24 heures": "Historia zasilania z ostatnich 24 godzin",
  "Historique indisponible": "Historia niedostępna",
  "Chargement de l'historique…": "Wczytywanie historii…",
  "Sauvegardes": "Kopie zapasowe",
  "Sauvegarde": "Kopia zapasowa",
  "Sauvegarde…": "Tworzenie kopii zapasowej…",
  "Réception…": "Odbieranie…",
  "Restauration…": "Przywracanie…",
  "Dernière": "Ostatnia",
  "Dernière sauvegarde": "Ostatnia kopia zapasowa",
  "Prochaine": "Następna",
  "État": "Stan",
  "Statut": "Status",
  "Version": "Wersja",
  "Dispo": "Dostępna",
  "État des disques": "Stan dysków",
  "Santé": "Kondycja",
  "Sécurité": "Bezpieczeństwo",
  "Sécurisé": "Zabezpieczony",
  "Alerte": "Alarm",
  "Alertes": "Alarmy",
  "Normal": "Normalny",
  "Dégradé": "Zdegradowany",
  "En panne": "Awaria",
  "Défaillant": "Uszkodzony",
  "Avertissement": "Ostrzeżenie",
  "Attention": "Uwaga",
  "Initialisé": "Zainicjowany",
  "Non initialisé": "Niezainicjowany",
  "Partition système en échec": "Awaria partycji systemowej",
  "Réparation…": "Naprawianie…",
  "Sur batterie": "Na baterii",
  "Secteur": "Zasilanie sieciowe",
  "Secteur · en charge": "Zasilanie sieciowe · ładowanie",
  "Batterie faible": "Niski poziom baterii",
  "Batterie à remplacer": "Wymień baterię",
  "Surcharge": "Przeciążenie",
  "Onduleur": "UPS",
  "Secteurs défectueux": "Uszkodzone sektory",
  "Erreurs CRC": "Błędy CRC",
  "Durée de vie": "Żywotność",
  "Mise à jour": "Aktualizacja",
  "Mises à jour": "Aktualizacje",
  "Mises à jour système": "Aktualizacje systemu",
  "Redémarrage requis": "Wymagane ponowne uruchomienie",
  "redémarrage requis": "wymagane ponowne uruchomienie",
  "À jour": "Aktualny",
  "à jour": "aktualny",
  "À installer": "Do zainstalowania",
  "Applications": "Aplikacje",
  "Application": "Aplikacja",
  "Détails": "Szczegóły",
  "Services": "Usługi",
  "Actions": "Działania",
  "Réglages": "Ustawienia",
  "Paramètres": "Ustawienia",
  "Paquets": "Pakiety",
  "Paquet": "Pakiet",
  "Paquets en attente": "Oczekujące pakiety",
  "Système d'exploitation": "System operacyjny",
  "Noyau": "Jądro systemu",
  "Nœuds": "Węzły",
  "Nœud": "Węzeł",
  "Invités": "Maszyny wirtualne",
  "Invité": "Maszyna wirtualna",
  "VM et conteneurs": "Maszyny wirtualne i kontenery",
  "Conteneurs": "Kontenery",
  "Tout démarrer": "Uruchom wszystkie",
  "Démarrer": "Uruchom",
  "Redémarrer": "Uruchom ponownie",
  "Arrêter": "Zatrzymaj",
  "Éteindre": "Wyłącz",
  "Allumer": "Włącz",
  "Veille": "Tryb uśpienia",
  "Redémarrer le Wi-Fi": "Uruchom ponownie Wi-Fi",
  "Éteindre les LED": "Wyłącz diody LED",
  "Allumer les LED": "Włącz diody LED",
  "Arrêt": "Zatrzymanie",
  "Lecture": "Odtwarzanie",
  "Pause": "Pauza",
  "Reprendre": "Wznów",
  "Précédent": "Poprzedni",
  "Suivant": "Następny",
  "Volume": "Głośność",
  "Muet": "Wyciszony",
  "Confirmer": "Potwierdź",
  "Confirmer ?": "Potwierdzić?",
  "Annuler": "Anuluj",
  "Appui long : marche / arrêt": "Przytrzymaj: włącz / wyłącz",
  "Afficher l'état des disques": "Pokaż stan dysków",
  "Protégé : pas d'arrêt ni de redémarrage depuis la carte": "Chroniony: nie można zatrzymać ani uruchomić ponownie z karty",
  "En ligne": "Online",
  "en ligne": "online",
  "Hors ligne": "Offline",
  "hors ligne": "offline",
  "Connecté": "Połączony",
  "connecté": "połączony",
  "Connectés": "Połączeni",
  "Déconnecté": "Rozłączony",
  "déconnecté": "rozłączony",
  "Activé": "Włączony",
  "activé": "włączony",
  "Désactivé": "Wyłączony",
  "désactivé": "wyłączony",
  "Éteint": "Wyłączony",
  "éteint": "wyłączony",
  "Éteinte": "Wyłączona",
  "Allumé": "Włączony",
  "allumé": "włączony",
  "Arrêté": "Zatrzymany",
  "arrêté": "zatrzymany",
  "En marche": "Uruchomiony",
  "en marche": "uruchomiony",
  "à l'arrêt": "zatrzymany",
  "En cours": "W toku",
  "en cours": "w toku",
  "Inactif": "Bezczynny",
  "Indisponible": "Niedostępny",
  "indisponible": "niedostępny",
  "Inconnu": "Nieznany",
  "inconnu": "nieznany",
  "Jamais connecté": "Nigdy niepołączony",
  "Terminé": "Zakończono",
  "Échoué": "Niepowodzenie",
  "Échec": "Błąd",
  "Bloqué": "Zablokowany",
  "en erreur": "błąd",
  "OK": "OK",
  "Oui": "Tak",
  "Non": "Nie",
  "Tout va bien": "Wszystko w porządku",
  "Tout est traité": "Wszystko obsłużono",
  "Rien d'ouvert : tout est traité.": "Brak otwartych zgłoszeń: wszystko obsłużono.",
  "aucun": "brak",
  "Aucun": "Brak",
  "Aucune": "Brak",
  "Tous": "Wszystkie",
  "Toutes": "Wszystkie",
  "Filtres": "Filtry",
  "Filtrage DNS": "Filtrowanie DNS",
  "Requêtes": "Zapytania",
  "Bloquées": "Zablokowane",
  "bloqué": "zablokowany",
  "Blocage": "Blokowanie",
  "Blocage désactivé": "Blokowanie wyłączone",
  "Protection": "Ochrona",
  "Protection désactivée": "Ochrona wyłączona",
  "Protection activée": "Ochrona włączona",
  "Domaines bloqués": "Zablokowane domeny",
  "Règles": "Reguły",
  "Transférées": "Przekierowane",
  "Contrôle parental": "Kontrola rodzicielska",
  "Navigation sécurisée": "Bezpieczne przeglądanie",
  "Recherches sécurisées": "Bezpieczne wyszukiwanie",
  "Temps de réponse": "Czas odpowiedzi",
  "Réponse": "Odpowiedź",
  "Internet bloqué": "Internet zablokowany",
  "Internet coupé": "Internet rozłączony",
  "Wi-Fi invités": "Sieci Wi-Fi gościnne",
  "Ports": "Porty",
  "Ports Ethernet": "Porty Ethernet",
  "Appareils connectés": "Podłączone urządzenia",
  "Appareils": "Urządzenia",
  "Appareil": "Urządzenie",
  "Dernières connexions": "Ostatnie połączenia",
  "Connexions récentes": "Ostatnie połączenia",
  "Tous les appareils": "Wszystkie urządzenia",
  "Filaire": "Przewodowy",
  "Aucun réseau invité actif": "Brak aktywnej sieci gościnnej",
  "Débits par bande": "Transfer według pasma",
  "Voir tous": "Pokaż wszystkie",
  "Réduire": "Zwiń",
  "Déplier": "Rozwiń",
  "Piles": "Baterie",
  "Pile": "Bateria",
  "Piles à changer": "Baterie do wymiany",
  "Piles faibles": "Słabe baterie",
  "Piles en bon état": "Baterie w dobrym stanie",
  "Sur secteur": "Zasilanie sieciowe",
  "Pont": "Bramka",
  "Zigbee et piles": "Zigbee i baterie",
  "Pont Zigbee2MQTT déconnecté : aucun appareil Zigbee ne répond.": "Bramka Zigbee2MQTT jest rozłączona: żadne urządzenie Zigbee nie odpowiada.",
  "Qualité du lien": "Jakość połączenia",
  "Dernière nouvelle": "Ostatnio widziany",
  "À surveiller": "Wymaga uwagi",
  "à surveiller": "wymaga uwagi",
  "À traiter": "Wymaga działania",
  "à traiter": "wymaga działania",
  "Signal faible": "Słaby sygnał",
  "Faible": "Słaby",
  "faible": "słaby",
  "Silencieux": "Brak aktywności",
  "Frais": "Chłodny",
  "Vitesse max": "Maksymalna prędkość",
  "Économie": "Oszczędny",
  "Raspberry Pi": "Raspberry Pi",
  "Suivis": "Monitorowane",
  "suivis": "monitorowane",
  "Serveurs Linux": "Serwery Linux",
  "Mettre à jour": "Aktualizuj",
  "Installer les mises à jour": "Zainstaluj aktualizacje",
  "Tous les serveurs sont à jour.": "Wszystkie serwery są aktualne.",
  "mise à jour en cours…": "trwa aktualizacja…",
  "tous à jour": "wszystkie aktualne",
  "tout est à jour": "wszystko jest aktualne",
  "Sécurité et redémarrage": "Bezpieczeństwo i ponowne uruchomienie",
  "Dernier handshake": "Ostatni handshake",
  "Pairs": "Peery",
  "Pair": "Peer",
  "pairs connectés": "połączone peery",
  "Aucun pair connecté": "Brak połączonych peerów",
  "Handshake": "Handshake",
  "Jamais": "Nigdy",
  "Vu": "Widziany",
  "Point d'accès": "Punkt końcowy",
  "Reçu par le serveur": "Odebrane przez serwer",
  "Envoyé par le serveur": "Wysłane przez serwer",
  "reçu": "odebrano",
  "envoyé": "wysłano",
  "Serveurs Glances": "Serwery Glances",
  "Mémoire": "Pamięć",
  "RAM libre": "Wolna pamięć RAM",
  "Processus": "Procesy",
  "processus": "procesy",
  "Charge": "Obciążenie",
  "Médias": "Media",
  "Multimédia": "Multimedia",
  "Bibliothèques": "Biblioteki",
  "Bibliothèque": "Biblioteka",
  "Lecteurs": "Odtwarzacze",
  "Lecteur": "Odtwarzacz",
  "Films": "Filmy",
  "Séries": "Seriale",
  "Musique": "Muzyka",
  "En lecture": "Odtwarzanie",
  "en lecture": "odtwarzanie",
  "Rien en lecture": "Nic nie jest odtwarzane",
  "En pause": "Wstrzymano",
  "en pause": "wstrzymano",
  "Lecture en cours": "Teraz odtwarzane",
  "Épisode": "Odcinek",
  "Saison": "Sezon",
  "Artiste": "Artysta",
  "Titre": "Tytuł",
  "Résumé": "Opis",
  "Commandé par": "Sterowany przez",
  "Durée": "Czas trwania",
  "Parcourir": "Przeglądaj",
  "Lire": "Odtwórz",
  "Lecture aléatoire": "Odtwarzanie losowe",
  "Minuteur": "Minutnik",
  "Minuteur de veille": "Minutnik uśpienia",
  "Aucun lecteur": "Brak odtwarzacza",
  "Nouvelle": "Nowa",
  "Nouvelles": "Nowe",
  "nouvelle": "nowa",
  "nouvelles": "nowe",
  "ouverte": "otwarta",
  "ouvertes": "otwarte",
  "Ouvert": "Otwarte",
  "brouillon": "szkic",
  "activité": "aktywność",
  "Activité": "Aktywność",
  "Dépôts": "Repozytoria",
  "Dépôt": "Repozytorium",
  "dépôt": "repozytorium",
  "dépôts": "repozytoria",
  "Issues et pull requests": "Zgłoszenia i pull requesty",
  "Actualiser": "Odśwież",
  "Lu": "Sprawdzono",
  "à l'instant": "przed chwilą",
  "Nombre": "Liczba",
  "Compte GitHub à indiquer": "Wymagane konto GitHub",
  "En marche d'abord": "Najpierw uruchomione",
  "Par nom": "Według nazwy",
  "Par CPU": "Według CPU",
  "Par RAM": "Według RAM",
  "Par type d'appareil (d'après le nom)": "Według typu urządzenia (na podstawie nazwy)",
  "Par pièce": "Według pomieszczenia",
  "Une seule liste": "Jedna lista",
  "Téléphones et ordinateurs": "Telefony i komputery",
  "Imprimantes": "Drukarki",
  "Domotique": "Automatyka domowa",
  "Tous les appareils à pile, et les appareils Zigbee": "Wszystkie urządzenia bateryjne i Zigbee",
  "Appareils Zigbee seulement (Zigbee2MQTT, ZHA)": "Tylko urządzenia Zigbee (Zigbee2MQTT, ZHA)",
  "Issues seulement": "Tylko zgłoszenia",
  "Pull requests seulement": "Tylko pull requesty",
  "Style MyElectricalData (bleu nuit)": "Styl MyElectricalData (granatowy)",
  "Style MyElectricalData, clair ou sombre selon Home Assistant": "Styl MyElectricalData, jasny lub ciemny zależnie od Home Assistant",
  "Thème Home Assistant (clair ou sombre)": "Motyw Home Assistant (jasny lub ciemny)",
  "Limite de GitHub atteinte : nouvel essai à": "Osiągnięto limit GitHub: kolejna próba o",
  "Erreur": "Błąd",
  "Erreur de connexion": "Błąd połączenia",
  "Sélectionner": "Wybierz",
  "Choisir": "Wybierz",
  "Historique": "Historia",
  "Dernier": "Ostatni",
  "Base de données": "Baza danych",
  "Certificat SSL": "Certyfikat SSL",
  "expire le": "wygasa",
  "expiré": "wygasł",
  "encore": "pozostało",
  "installation…": "instalowanie…",
  "disponible": "dostępna",
  "sur": "z",
  "depuis": "od",
  "il y a": "temu",
  "dans": "za",
  "moins d'une minute": "mniej niż minuta",
  "j": "d",
  "Go": "GB",
  "To": "TB",
  "Mo": "MB",
  "n°": "nr",
  "Aucun capteur trouvé": "Nie znaleziono czujników",
  "Ajoutez l'intégration System Monitor (Paramètres → Appareils et services) ou indiquez vos capteurs dans": "Dodaj integrację System Monitor (Ustawienia → Urządzenia i usługi) lub określ czujniki w",
  "(voir le README).": "(patrz README).",
  "Aucun nœud Proxmox VE trouvé": "Nie znaleziono węzłów Proxmox VE",
  "Ajoutez l'intégration Proxmox VE (Paramètres › Appareils et services), puis rechargez la page.": "Dodaj integrację Proxmox VE (Ustawienia › Urządzenia i usługi), a następnie odśwież stronę.",
  "Aucun OpenMediaVault trouvé": "Nie znaleziono OpenMediaVault",
  "Aucun routeur ASUS trouvé": "Nie znaleziono routera ASUS",
  "Aucun appareil suivi par Ping": "Nie znaleziono urządzeń monitorowanych przez Ping",
  "Ajoutez l'intégration Ping (ICMP) pour chaque appareil dans Paramètres › Appareils et services, puis rechargez la page.": "Dodaj integrację Ping (ICMP) dla każdego urządzenia w Ustawienia › Urządzenia i usługi, a następnie odśwież stronę.",
  "Aucun appareil à pile ni appareil Zigbee trouvé": "Nie znaleziono urządzeń bateryjnych ani Zigbee",
  "Aucun serveur WireGuard trouvé": "Nie znaleziono serwera WireGuard",
  "Aucun serveur Glances trouvé": "Nie znaleziono serwera Glances",
  "Aucun serveur multimédia trouvé": "Nie znaleziono serwera multimediów",
  "Ajoutez l'intégration Plex, Jellyfin ou Emby dans Paramètres › Appareils et services, puis rechargez la page.": "Dodaj integrację Plex, Jellyfin lub Emby w Ustawienia › Urządzenia i usługi, a następnie odśwież stronę.",
  "Aucun serveur AdGuard Home ni Pi-hole trouvé": "Nie znaleziono serwera AdGuard Home ani Pi-hole",
  "Ajoutez l'intégration AdGuard Home ou Pi-hole (Paramètres › Appareils et services), puis rechargez la page.": "Dodaj integrację AdGuard Home lub Pi-hole (Ustawienia › Urządzenia i usługi), a następnie odśwież stronę.",
  "Aucun serveur trouvé": "Nie znaleziono serwera",
  "Aucune mise à jour": "Brak aktualizacji",
  "Aucun équipement": "Brak sprzętu",
  "Cette carte lit les entités": "Ta karta odczytuje encje",
  "Indiquez-les dans": "Określ je w",
  "si besoin.": "w razie potrzeby.",
  "La carte OPNsense a déménagé": "Karta OPNsense została przeniesiona",
  "Elle a maintenant son propre dépôt : installez « Carte OPNsense » depuis HACS": "Ma teraz własne repozytorium: zainstaluj „Carte OPNsense” przez HACS",
  "(dépôt personnalisé": "(repozytorium niestandardowe",
  "puis remplacez": "następnie zamień",
  "par": "na",
  "dans ce tableau de bord.": "na tym panelu.",
  "Les options restent les mêmes.": "Pozostałe opcje są takie same.",
  "Routeur ASUS": "Router ASUS",
  "Routeurs ASUS": "Routery ASUS",
  "publiées en MQTT par": "publikowane przez MQTT przez",
  "publiées en MQTT": "publikowane przez MQTT",
  "suivi par Ping": "monitorowane przez Ping",
  "suivis par Ping": "monitorowane przez Ping",
  "suivi": "monitorowany",
  "Aucune entité trouvée": "Nie znaleziono encji",
  "Aucune entité Synology trouvée": "Nie znaleziono encji Synology",
  "de Home Assistant (intégration Supervisor). Indiquez-les dans": "z Home Assistant (integracja Supervisor). Określ je w",
  "et": "i",
  "si besoin (voir le README).": "w razie potrzeby (patrz README).",
  "NAS indisponible": "NAS niedostępny",
  "NAS disponible": "NAS dostępny",
  "Ajoutez l'intégration Synology DSM, ou indiquez le préfixe de vos entités (": "Dodaj integrację Synology DSM lub podaj prefiks encji (",
  ") dans la configuration.": ") w konfiguracji.",
  "Appui long : mode suivant": "Przytrzymaj: następny tryb",
  "Machine virtuelle": "Maszyna wirtualna",
  "Conteneur LXC": "Kontener LXC",
  "Actions du nœud": "Działania węzła",
  "Redémarrage et arrêt masqués : ce nœud fait tourner Home Assistant.": "Ponowne uruchomienie i wyłączenie są niedostępne: na tym węźle działa Home Assistant.",
  "cliquez encore pour confirmer": "kliknij ponownie, aby potwierdzić",
  "Cliquez encore pour couper": "Kliknij ponownie, aby wyłączyć",
  "Cliquer pour couper": "Kliknij, aby wyłączyć",
  "Cliquer pour activer": "Kliknij, aby włączyć",
  "Couper le blocage pendant": "Wyłącz blokowanie na",
  "les paquets": "pakiety",
  "Masquer": "Ukryj",
  "Voir": "Pokaż",
  "Voir les paquets": "Pokaż pakiety",
  "Masquer les paquets": "Ukryj pakiety",
  "Confirmer :": "Potwierdź:",
  "Installez l'intégration OpenMediaVault (HACS, dépôt SlyBase/homeassistant-openmediavault), ajoutez-la dans Paramètres › Appareils et services, puis rechargez la page.": "Zainstaluj integrację OpenMediaVault (HACS, repozytorium SlyBase/homeassistant-openmediavault), dodaj ją w Ustawienia › Urządzenia i usługi, a następnie odśwież stronę.",
  "Installez l'intégration AsusRouter (HACS, dépôt Vaskivskyi/ha-asusrouter), ajoutez-la dans Paramètres › Appareils et services, puis rechargez la page.": "Zainstaluj integrację AsusRouter (HACS, repozytorium Vaskivskyi/ha-asusrouter), dodaj ją w Ustawienia › Urządzenia i usługi, a następnie odśwież stronę.",
  "Voir les appareils": "Pokaż urządzenia",
  "Voir les dernières connexions": "Pokaż ostatnie połączenia",
  "Aucun VPN actif": "Brak aktywnego VPN",
  "Connecté,": "Połączony,",
  "connecté,": "połączony,",
  "LAN connectés": "podłączone do LAN",
  "depuis le démarrage": "od uruchomienia",
  "Afficher": "Pokaż",
  "Aucun appareil": "Brak urządzeń",
  "latence moyenne": "średnie opóźnienie",
  "perte de paquets": "utrata pakietów",
  "Tout en ligne": "Wszystkie online",
  "éteint (volontairement)": "wyłączony (celowo)",
  "Éteint (volontairement)": "Wyłączony (celowo)",
  "La carte lit les capteurs de batterie (en %) de vos appareils, et les appareils Zigbee2MQTT ou ZHA. Vérifiez que leurs capteurs de batterie sont activés.": "Karta odczytuje czujniki poziomu baterii (w %) urządzeń oraz urządzenia Zigbee2MQTT lub ZHA. Sprawdź, czy ich czujniki baterii są włączone.",
  "pile faible": "słaba bateria",
  "piles faibles": "słabe baterie",
  "piles": "baterie",
  "pile": "bateria",
  "plus faible": "najsłabsza",
  "aucune pile": "brak baterii",
  "signal faible ou silencieux": "słaby sygnał lub brak aktywności",
  "Signal faible ou silencieux": "Słaby sygnał lub brak aktywności",
  "Dernière nouvelle il y a": "Ostatnio widziany: temu",
  "Installez l'intégration WGDashboard Monitor (HACS) et ajoutez votre WGDashboard dans Paramètres › Appareils et services, puis rechargez la page.": "Zainstaluj integrację WGDashboard Monitor (HACS), dodaj WGDashboard w Ustawienia › Urządzenia i usługi, a następnie odśwież stronę.",
  "Handshake il y a": "Ostatni handshake",
  "Vu il y a": "Ostatnio widziany",
  "Installez Glances (mode web, glances -w) sur vos serveurs, puis ajoutez l'intégration Glances dans Paramètres › Appareils et services.": "Zainstaluj Glances (tryb web, glances -w) na serwerach, a następnie dodaj integrację Glances w Ustawienia › Urządzenia i usługi.",
  "Retour à la liste": "Wróć do listy",
  "Voir la fiche": "Pokaż szczegóły",
  "Fiche de": "Szczegóły",
  "Voir le contenu": "Pokaż zawartość",
  "Ouvrir": "Otwórz",
  "Retour": "Wróć",
  "Fermer": "Zamknij",
  "Rechercher…": "Szukaj…",
  "Rechercher": "Szukaj",
  "Rien à afficher.": "Brak danych do wyświetlenia.",
  "Aucun lecteur allumé : allumez la TV et ouvrez Plex pour lancer une lecture.": "Brak aktywnego odtwarzacza: włącz telewizor i uruchom Plex, aby rozpocząć odtwarzanie.",
  "Reprendre la lecture (par Plex)": "Wznów odtwarzanie (przez Plex)",
  "Reprendre la lecture": "Wznów odtwarzanie",
  "Voir les lecteurs": "Pokaż odtwarzacze",
  "Veille dans": "Uśpienie za",
  "Aucune lecture": "Brak odtwarzania",
  "Volume du lecteur": "Głośność odtwarzacza",
  "Mise en veille": "Przechodzenie w stan uśpienia",
  "lecture en cours": "trwa odtwarzanie",
  "Nombre de lecteurs": "Liczba odtwarzaczy",
  "(Paramètres → Notifications → MQTT, avec l'option Home Assistant). Indiquez-les dans": "(Ustawienia → Powiadomienia → MQTT, z opcją Home Assistant). Określ je w",
  "Choisissez le compte ou l'organisation à suivre dans l'éditeur (option": "Wybierz konto lub organizację do monitorowania w edytorze (opcja",
  "), par exemple": "), na przykład",
  "Tout marquer comme vu": "Oznacz wszystko jako obejrzane",
  "Relire maintenant": "Sprawdź ponownie",
  "commentaire": "komentarz",
  "commentaires": "komentarze",
  "Aucune issue": "Brak zgłoszeń",
  "dépôt personnalisé": "repozytorium niestandardowe",
  "blocage en cours": "blokowanie aktywne",
  "Aucun filtre": "Brak filtra",
  "Dernière analyse": "Ostatnia analiza",
  "Certificat": "Certyfikat",
  "Installez": "Zainstaluj",
  "Ajoutez": "Dodaj",
  "Enregistrer": "Zapisz",
  "Télécharger": "Pobierz",
  "Télécharger les mises à jour": "Pobierz aktualizacje",
  "en attente": "oczekujące",
  "à installer": "do zainstalowania",
  "Source": "Źródło",
  "Total": "Łącznie",
  "Batterie": "Bateria",
  "Sortie": "Wyjście",
  "Entrée": "Wejście",
  "Réseaux invités": "Sieci gościnne",
  "Appareils sans connexion": "Urządzenia bez połączenia",
  "Événements": "Zdarzenia",
  "Temps réel": "W czasie rzeczywistym",
  "Requêtes bloquées": "Zablokowane zapytania",
  "sous-tension": "zbyt niskie napięcie"
};
// Polish inflected phrases with counts (computed before single-word replacements).
const plCountForm = (n, one, few, many) => {
  const value = Math.abs(Number(n));
  return value === 1 ? one : (value % 10 >= 2 && value % 10 <= 4 && (value % 100 < 12 || value % 100 > 14)) ? few : many;
};
const PL_PATTERNS = [
  [/(\d+)\s+appareil(s?)\s+suivi(s?)\s+par Ping/gi, (_, n) => `${n} ${plCountForm(n, 'urządzenie monitorowane', 'urządzenia monitorowane', 'urządzeń monitorowanych')} przez Ping`],
  [/(\d+)\s+pile(s?) faible(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'słaba bateria', 'słabe baterie', 'słabych baterii')}`],
  [/(\d+)\s+mises? à jour/gi, (_, n) => `${n} ${plCountForm(n, 'aktualizacja', 'aktualizacje', 'aktualizacji')}`],
  [/(\d+)\s+nœud(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'węzeł', 'węzły', 'węzłów')}`],
  [/(\d+)\s+invité(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'maszyna wirtualna', 'maszyny wirtualne', 'maszyn wirtualnych')}`],
  [/(\d+)\s+serveur(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'serwer', 'serwery', 'serwerów')}`],
  [/(\d+)\s+appareil(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'urządzenie', 'urządzenia', 'urządzeń')}`],
  [/(\d+)\s+pair(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'peer', 'peery', 'peerów')}`],
  [/(\d+)\s+dépôt(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'repozytorium', 'repozytoria', 'repozytoriów')}`],
  [/(\d+)\s+redémarrage(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'ponowne uruchomienie', 'ponowne uruchomienia', 'ponownych uruchomień')}`],
  [/(\d+)\s+nouvelle(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'nowa', 'nowe', 'nowych')}`],
  [/(\d+)\s+ouverte(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'otwarta', 'otwarte', 'otwartych')}`],
  [/(\d+)\s+heure(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'godzina', 'godziny', 'godzin')}`],
  [/(\d+)\s+jour(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'dzień', 'dni', 'dni')}`],
  [/(\d+)\s+semaine(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'tydzień', 'tygodnie', 'tygodni')}`],
  [/(\d+)\s+minute(s?)/gi, (_, n) => `${n} ${plCountForm(n, 'minuta', 'minuty', 'minut')}`],
  [/(\d+)\s+j\b/g, '$1 d'],
  [/(\d+)\s+suivi(s?) par Ping/gi, '$1 monitorowanych przez Ping'],
  [/(\d+)\s+éteint(s?)/gi, '$1 wyłączonych'],
  [/(\d+)\s+à pile/gi, '$1 bateryjnych'],
  [/(\d+)\s+à surveiller/gi, '$1 wymaga uwagi'],
  [/(\d+)\s+à traiter/gi, '$1 wymaga działania'],
  [/(\d+)\s+à mettre à jour/gi, '$1 do aktualizacji'],
  [/(\d+)\s+LAN connectés/gi, '$1 podłączonych do LAN'],
  [/\bil y a (\d+)\s+(min|h|j)\b/gi, '$1 $2 temu'],
];

// Localized visual-editor field labels, covering all 14 cards.
const PL_EDITOR_COMMON = {
  title: 'Tytuł', subtitle: 'Podtytuł', icon: 'Ikona', icon_color: 'Kolor ikony',
  theme: 'Motyw kolorystyczny karty', text_size: 'Rozmiar tekstu (100% = normalny)',
  net_max: 'Maksymalna wartość skali transferu sieciowego',
  ups_device: 'UPS (urządzenie NUT, opcjonalnie)', ups_name: 'Nazwa UPS (opcjonalnie)',
  navigation_path: 'Strona otwierana po kliknięciu tytułu (opcjonalnie)',
  show_info: 'Sekcja informacji', show_resources: 'Sekcja zasobów',
  show_network: 'Sekcja ruchu sieciowego', show_actions: 'Sekcja działań',
  show_ups: 'Sekcja UPS (NUT)', show_system: 'Sekcja systemu',
  show_apps: 'Sekcja aplikacji', show_thermal: 'Sekcja temperatur i chłodzenia',
  show_storage: 'Sekcja pamięci masowej', show_details: 'Sekcja szczegółów',
  show_clients: 'Sekcja podłączonych klientów', expanded: 'Domyślnie rozwinięte',
};
const PL_EDITOR_LABELS = {
  SRV: {
    title: 'Tytuł (np. Raspberry Pi 4 4 GB)',
    icon: 'Ikona nagłówka (np. mdi:raspberry-pi)', icon_color: 'Kolor ikony (np. #E30B5D)',
    fan: 'Wentylator: encja fan.* lub czujnik RPM / procent (opcjonalnie)',
    ram_total: 'Całkowita pamięć RAM dla wskaźnika wolnej RAM (opcjonalnie)',
    backup_title: 'Tytuł sekcji kopii zapasowych (opcjonalnie)',
    temp_warn: 'Temperatura: próg ostrzegawczy', temp_alert: 'Temperatura: próg alarmowy',
    show_power: 'Sekcja zasilania', show_backup: 'Sekcja kopii zapasowych',
  },
  MAJ: {
    database: 'Rozmiar bazy danych (opcjonalnie, domyślnie wykrywany automatycznie)',
    ssl: 'Ważność certyfikatu SSL (opcjonalnie, domyślnie wykrywana automatycznie)',
    ssl_warn: 'Ostrzeżenie o certyfikacie SSL poniżej (dni)',
    ssl_alert: 'Alarm certyfikatu SSL poniżej (dni)',
    include_hacs: 'Uwzględnij aktualizacje HACS w aplikacjach',
    include_devices: 'Uwzględnij aktualizacje firmware urządzeń (Zigbee, ESPHome…)',
    updates_first: 'Najpierw pokazuj aplikacje wymagające aktualizacji',
    show_system: 'Sekcja aktualizacji systemu',
  },
  NAS: {
    device: 'NAS (urządzenie Synology DSM, opcjonalnie)',
    title: 'Tytuł (domyślnie nazwa urządzenia)',
    tracker: 'Tracker sieci NAS dla adresu IP (opcjonalnie)',
    ip: 'Adres IP NAS lub encja zawierająca adres (puste = tracker lub adres integracji Synology DSM)',
    volume_name: 'Nazwa woluminu 1 (np. HDD 4 TB)',
    fan: 'Tryb wentylatora (encja select, opcjonalnie)',
    shutdown: 'Przycisk wyłączenia NAS (puste = przycisk Stop z Synology DSM)',
    power_on: 'Włączenie NAS: Wake on LAN, inteligentne gniazdko lub skrypt (puste = wykryj Wake on LAN)',
    actions: 'Dodatkowe przełączniki i przyciski (gniazdka, mini-PC…)',
    usb: 'Dyski USB: czujniki procentowego użycia (puste = automatyczne wykrywanie Synology DSM)',
    show_ups: 'Sekcja UPS',
  },
  PVE: {
    nodes: 'Widoczne węzły (puste = wszystkie)',
    protect: 'Chronione maszyny: wyłącz zatrzymanie i restart (puste = wykryj VM Home Assistant)',
    sort: 'Sortowanie maszyn', hide_stopped: 'Ukryj zatrzymane maszyny',
    show_node: 'Sekcja węzła', show_storage: 'Sekcja dysków', show_guests: 'Sekcja maszyn wirtualnych',
    show_actions: 'Przyciski uruchamiania, zatrzymania i restartu (potwierdzenie drugim kliknięciem)',
  },
  OMV: {
    device: 'Urządzenie integracji OpenMediaVault (opcjonalnie)', title: 'Tytuł (domyślnie OpenMediaVault)',
    ip: 'Wyświetlany adres IP (puste = adres integracji)',
    power_on: 'Włączenie przy wyłączonym OMV: Wake on LAN, gniazdko lub skrypt (opcjonalnie)',
    show_system: 'Sekcja systemu (czas pracy, wersja, obciążenie, CPU, RAM)',
    show_storage: 'Sekcja systemów plików', show_disks: 'Sekcja dysków (temperatura, SMART)',
    show_services: 'Sekcja usług (NFS, SMB, SSH…)',
    show_actions: 'Przyciski restartu, uśpienia i wyłączenia (potwierdzenie drugim kliknięciem)',
  },
  ASUS: {
    device: 'Router (urządzenie integracji AsusRouter, opcjonalnie)',
    title: 'Tytuł (domyślnie model routera)',
    ip: 'Wyświetlany adres IP (puste = adres routera)',
    wan_max: 'Maksymalna skala transferu internetowego (prędkość łącza)',
    wifi_max: 'Maksymalna skala transferu Wi-Fi i LAN',
    latest: 'Liczba ostatnich połączeń (0 = brak)',
    show_system: 'Sekcja systemu (czas pracy, firmware, obciążenie, CPU, RAM, temperatury)',
    show_internet: 'Sekcja internetu (połączenie, publiczny adres IP, transfer)',
    show_wifi: 'Sekcja Wi-Fi (pasma, sieci gościnne, transfer)',
    show_ports: 'Sekcja portów Ethernet', show_clients: 'Sekcja podłączonych urządzeń',
    show_vpn: 'Sekcja VPN i kontroli rodzicielskiej',
    show_actions: 'Przyciski restartu, Wi-Fi i diod LED (potwierdzenie drugim kliknięciem)',
  },
  PING: {
    group_by: 'Grupowanie urządzeń', expanded: 'Rozwiń grupy przy otwieraniu',
    standby: 'Celowo wyłączone urządzenia (szary status Wyłączony zamiast czerwonego)',
    standby_groups: 'Grupy celowo wyłączone',
    warn_ms: 'Próg ostrzegawczy opóźnienia (ms)', alert_ms: 'Próg alarmowy opóźnienia (ms)',
  },
  ZB: {
    source: 'Monitorowane urządzenia', include_phones: 'Uwzględnij telefony i tablety (Companion App)',
    warn: 'Próg ostrzegawczy niskiego poziomu baterii (%)', alert: 'Próg wymiany baterii (%)',
    lqi_warn: 'Próg słabej jakości połączenia Zigbee (0–255)',
    silent_hours: 'Urządzenie uznawane za nieaktywne po (godzinach)',
    exclude: 'Encje lub urządzenia do pominięcia',
    expanded: 'Domyślnie rozwiń grupy zdrowych baterii i urządzeń sieciowych',
  },
  WG: {
    expanded: 'Domyślnie rozwiń serwery',
    show_endpoint: 'Pokazuj publiczne adresy peerów (w przeciwnym razie tylko podpowiedź)',
    names: 'Nazwy wyświetlane peerów (YAML: oryginalna nazwa: nowa nazwa)',
  },
  GL: {
    expanded: 'Domyślnie rozwiń serwery',
    temp_warn: 'Ostrzeżenie o temperaturze powyżej', temp_alert: 'Alarm temperatury powyżej',
  },
  MEDIA: {
    show_libraries: 'Pokazuj biblioteki (włącz czujniki w integracji)',
    show_clients: 'Lista znanych odtwarzaczy (rozwijana)',
    show_controls: 'Sterowanie odtwarzaniem (pauza, stop, pomijanie…)',
    show_volume: 'Sterowanie głośnością i wyciszaniem', volume_step: 'Krok zmiany głośności',
    sleep_timer: 'Czas minutnika uśpienia (minuty)',
    sleep_player: 'Odtwarzacz dla minutnika uśpienia (puste = wszystkie)',
    show_details: 'Przycisk szczegółów',
    browse: 'Kliknięcie biblioteki: przeglądanie zawartości i odtwarzanie',
    browse_player: 'Domyślny odtwarzacz',
    control_players: 'Odtwarzacz sterujący urządzeniem (YAML: odtwarzacz Plex: odtwarzacz TV), inaczej dopasowanie po nazwie',
  },
  DNS: {
    title: 'Tytuł (puste = AdGuard Home, Pi-hole lub Filtrowanie DNS)',
    servers: 'Widoczne serwery w kolejności (puste = wszystkie)',
    show_stats: 'Zapytania i odsetek zablokowanych', show_details: 'Sekcja szczegółów',
    show_switches: 'Sekcja ustawień (przełączniki, pauza Pi-hole)',
    show_update: 'Sekcja aktualizacji',
  },
  LNX: {
    entities: 'Widoczne serwery w kolejności (puste = wszystkie, wykrywane automatycznie)',
    show_uptodate: 'Pokazuj również aktualne serwery',
    show_os: 'System operacyjny, jądro i czas pracy',
    show_packages: 'Lista oczekujących pakietów (rozwijana)',
    show_actions: 'Przycisk aktualizacji (potwierdzenie drugim kliknięciem)',
    show_app: 'Stan aktualizacji Linux Update Dashboard',
  },
  GH: {
    user: 'Monitorowane konto lub organizacja GitHub', types: 'Typy wyświetlanych elementów',
    exclude: 'Repozytoria do pominięcia', repos: 'Monitorowane repozytoria (puste = wszystkie)',
    hide_bots: 'Ukryj zgłoszenia tworzone przez boty (github-actions, dependabot…)',
    exclude_authors: 'Autorzy do pominięcia', refresh: 'Sprawdzaj GitHub co (minuty, minimum 5)',
    max_items: 'Maksymalna liczba elementów', expanded: 'Domyślnie rozwiń repozytoria',
    show_labels: 'Etykiety (błąd, propozycja funkcji…)',
  },
};

// Display fragments with quantities, dates and status descriptions.
const EN_PATTERNS = [
  [/\b(\d+)\s+appareil(s?)\s+suivi(s?)\s+par Ping\b/gi, (_, n, plural) => `${n} device${plural ? "s" : ""} monitored by Ping`],
  [/\b(\d+)\s+nœud(s?)\b/gi, (_, n, plural) => `${n} node${plural ? "s" : ""}`],
  [/\b(\d+)\s+invité(s?)\b/gi, (_, n, plural) => `${n} guest${plural ? "s" : ""}`],
  [/\b(\d+)\s+pile(s?) faible(s?)\b/gi, (_, n, plural) => `${n} low batter${plural ? "ies" : "y"}`],
  [/\b(\d+)\s+heure(s?)\b/gi, (_, n, plural) => `${n} hour${plural ? "s" : ""}`],
  [/\b(\d+)\s+j\b/g, "$1 d"],
  [/\b(\d+)\s+serveur(s?)\b/gi, (_, n, s) => `${n} server${s ? "s" : ""}`],
  [/\b(\d+)\s+appareil(s?)\b/gi, (_, n, s) => `${n} device${s ? "s" : ""}`],
  [/\b(\d+)\s+pair(s?)\b/gi, (_, n, s) => `${n} peer${s ? "s" : ""}`],
  [/\b(\d+)\s+dépôt(s?)\b/gi, (_, n, s) => `${n} repositor${s ? "ies" : "y"}`],
  [/\b(\d+)\s+mise(s?) à jour\b/gi, (_, n, s) => `${n} update${s ? "s" : ""}`],
  [/\b(\d+)\s+redémarrage(s?)\b/gi, (_, n, s) => `${n} restart${s ? "s" : ""}`],
  [/\b(\d+)\s+nouvelle(s?)\b/gi, (_, n, s) => `${n} new`],
  [/\b(\d+)\s+ouverte(s?)\b/gi, (_, n, s) => `${n} open`],
  [/\b(\d+)\s+suivi(s?) par Ping\b/gi, "$1 monitored by Ping"],
  [/\b(\d+)\s+éteint(s?)\b/gi, "$1 off"],
  [/\b(\d+)\s+à pile\b/gi, "$1 battery-powered"],
  [/\b(\d+)\s+à surveiller\b/gi, "$1 need attention"],
  [/\b(\d+)\s+à traiter\b/gi, "$1 need action"],
  [/\b(\d+)\s+à mettre à jour\b/gi, "$1 to update"],
  [/\b(\d+)\s+LAN connectés\b/gi, "$1 LAN connected"],
  [/\b(\d+)\s+jour(s?)\b/gi, (_, n, s) => `${n} day${s ? "s" : ""}`],
  [/\b(\d+)\s+semaine(s?)\b/gi, (_, n, s) => `${n} week${s ? "s" : ""}`],
  [/\b(\d+)\s+heure(s?)\b/gi, (_, n, s) => `${n} hour${s ? "s" : ""}`],
  [/\b(\d+)\s+minute(s?)\b/gi, (_, n, s) => `${n} minute${s ? "s" : ""}`],
];
// A string only matches on a full word boundary, so incidental substrings of
// user-defined names / entity IDs are not rewritten.  Exact matches go first.
const EN_KEYS = Object.keys(EN_TEXT).sort((a, b) => b.length - a.length);
const safeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EN_FRAGMENT_RULE = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${EN_KEYS.filter((s) => s.length > 1).map(safeRegExp).join("|")})(?![\\p{L}\\p{N}_])`, "gu"
);
const translateEnglish = (original) => {
  const raw = String(original ?? "");
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  // Spaces around DOM text nodes are kept so the original HTML layout survives.
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
  if (Object.prototype.hasOwnProperty.call(EN_TEXT, trimmed))
    return `${match[1]}${EN_TEXT[trimmed]}${match[3]}`;
  let result = raw;
  for (const [regex, fn] of EN_PATTERNS) result = result.replace(regex, fn);
  result = result.replace(EN_FRAGMENT_RULE, (match) => EN_TEXT[match]);
  return result;
};
// Whole labels and short fragments are matched longest-first.  Do not touch
// entity identifiers, attributes that are not human-facing, or script content.
const PL_KEYS = Object.keys(PL_TEXT).sort((a, b) => b.length - a.length);
const PL_FRAGMENT_RULE = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${PL_KEYS.filter((key) => key.length > 1).map(safeRegExp).join("|")})(?![\\p{L}\\p{N}_])`, "gu"
);
const translatePolish = (original) => {
  const raw = String(original ?? "");
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
  if (Object.prototype.hasOwnProperty.call(PL_TEXT, trimmed))
    return `${match[1]}${PL_TEXT[trimmed]}${match[3]}`;
  let result = raw;
  for (const [regex, fn] of PL_PATTERNS) result = result.replace(regex, fn);
  return result.replace(PL_FRAGMENT_RULE, (key) => PL_TEXT[key]);
};
const translateByLanguage = (original, lang) =>
  lang === "pl" ? translatePolish(original) : lang === "en" ? translateEnglish(original) : original;
const localizeCardDOM = (root, lang) => {
  if (!root || lang === "fr") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return /^(STYLE|SCRIPT|CODE|PRE|TEXTAREA)$/i.test(node.parentElement?.tagName || "")
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    const value = translateByLanguage(node.nodeValue, lang);
    if (node.nodeValue !== value) node.nodeValue = value;
  }
  for (const el of root.querySelectorAll("[title],[aria-label],[placeholder]")) {
    for (const attr of ["title", "aria-label", "placeholder"]) {
      if (el.hasAttribute(attr)) {
        const old = el.getAttribute(attr), next = translateByLanguage(old, lang);
        if (old !== next) el.setAttribute(attr, next);
      }
    }
  }
};
// Wrapping the synchronous render function centralizes locale selection and
// avoids touching sensor discovery, actions, event handlers and the HTML layout.
const enableCardLocalization = (CardType) => {
  const originalRender = CardType.prototype._render;
  CardType.prototype._render = function (...args) {
    const lang = cardLanguage(this._config, this._hass);
    // All cards memoize the render signature: a locale change must invalidate it.
    if (this._lastRenderedLanguage !== lang) this._sig = null;
    this._lastRenderedLanguage = lang;
    const previousLanguage = CURRENT_CARD_LANGUAGE;
    CURRENT_CARD_LANGUAGE = lang;
    try {
      const result = originalRender.apply(this, args);
      if (lang !== "fr") localizeCardDOM(this.shadowRoot, lang);
      return result;
    } finally {
      CURRENT_CARD_LANGUAGE = previousLanguage;
    }
  };
};


/* ------------------------------------------------------------- affichage */

const fmt = (n, digits = 1) =>
  n === null || n === undefined
    ? "—"
    : Number(n).toLocaleString(cardLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Unité d'un capteur : texte sans caractère HTML (elle est insérée telle quelle dans les cadrans). */
const cleanUnit = (u) => String(u ?? "").replace(/[&<>"'`]/g, "");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
  if (CURRENT_CARD_LANGUAGE === "pl") {
    const plTxt = a < 90 ? "mniej niż minutę" : a < 3600 ? `${Math.round(a / 60)} min` : a < 86400 ? `${Math.round(a / 3600)} godz.` : `${Math.round(a / 86400)} ${plCountForm(Math.round(a / 86400), "dzień", "dni", "dni")}`;
    return s >= 0 ? `za ${plTxt}` : `${plTxt} temu`;
  }
  return CURRENT_CARD_LANGUAGE === "en" ? (s >= 0 ? `in ${a < 90 ? "less than a minute" : txt}` : `${a < 90 ? "less than a minute" : txt} ago`) : s >= 0 ? `dans ${txt}` : `il y a ${txt}`;
};

/** Durée depuis une date, compacte : « 12 j 4 h », « 3 h 05 min ». */
const since = (iso) => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const m = Math.max(0, Math.floor((Date.now() - t) / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mn = m % 60;
  return d ? `${d} ${CURRENT_CARD_LANGUAGE === "en" || CURRENT_CARD_LANGUAGE === "pl" ? "d" : "j"} ${h} h` : h ? `${h} h ${String(mn).padStart(2, "0")} min` : `${mn} min`;
};

/** « 22/10 23:40 », raccourci à « 22/10 » dans les tuiles étroites par le CSS. */
const dayMonth = (iso) => new Date(iso).toLocaleDateString(cardLocale(), { day: "2-digit", month: "2-digit", year: "2-digit" });

/** Taille du texte (option text_size, en %) : toute la carte est agrandie, texte et icônes, sans rien couper. */
const zoomOf = (c) => {
  const v = Number(c?.text_size);
  return Number.isFinite(v) && v > 0 && v !== 100 ? `zoom:${Math.min(200, Math.max(70, v)) / 100}` : "";
};
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
    return cleanUnit(this._st(id)?.attributes?.unit_of_measurement ?? d);
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
    const fmtT = (t) => new Date(t).toLocaleString(cardLocale(), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
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
    const sec = (icon, title, body) => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${esc(icon)}"></ha-icon>${title}</div>${body}</div>` : "");
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
        <div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${v}<small>${unit}</small></b></div>
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
        <div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${v !== null ? fmt(v, v < 10 ? 2 : 1) : "—"}<small> ${esc(unit)}</small></b></div>
        <div class="g-bar"><i style="width:${mb === null ? 0 : Math.min(100, (mb / netMax) * 100)}%"></i></div></div>`;
    };
    const nets = [net(m.net_in, "mdi:download", "Download", netIn, "srv-in"), net(m.net_out, "mdi:upload", "Upload", netOut, "srv-out")].filter(Boolean);

    const power = m.power
      ? `<div class="srv-state srv-pw ${powerOk === null ? "" : powerOk ? "ok" : "bad"}" data-entity="${esc(m.power)}">
          <div class="srv-pwh"><ha-icon icon="${esc(powerOk === false ? "mdi:flash-alert" : c.icon || "mdi:power-plug-outline")}"></ha-icon><span>${powerOk === false ? "Sous-tension détectée : vérifiez l'alimentation" : "État de l'alimentation sur 24 h"}</span><b>${powerOk === null ? "—" : powerOk ? "OK" : "Danger"}</b></div>
          ${this._timeline(m.power)}</div>`
      : "";

    const bTile = (id, icon, label, v, n, cls = "") => (v === null ? "" : `<div class="tile srv-b ${cls}" data-entity="${esc(id || "")}"><ha-icon icon="${esc(icon)}"></ha-icon><div class="tile-l">${label}</div><div class="srv-bv">${esc(v)}</div>${n ? `<div class="tile-n">${esc(n)}</div>` : ""}</div>`);
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
        c.show_backup !== false ? sec(m.drive_used || m.drive_size ? "mdi:google-drive" : "mdi:cloud-upload-outline", esc(c.backup_title || (m.drive_used || m.drive_size ? "Google Drive Backup" : "Sauvegardes")), backups.length ? `<div class="srv-bk">${backups.join("")}</div>` : "") : "",
      ].join("");

    const alertCls = powerOk === false || (temp !== null && temp >= c.temp_alert) ? "srv-alert" : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${alertCls}">
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
.srv-h ha-icon { --mdc-icon-size: 18px; color: var(--med-accent, var(--med-blue)); }
.srv-tiles { margin: 0 !important; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)) !important; }
.srv-t { cursor: pointer; }
.srv-t .tile-l { display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--med-text); margin-bottom: 4px; }
.srv-t .tile-l ha-icon, .srv-b ha-icon { --mdc-icon-size: 18px; color: var(--med-accent, var(--med-blue)); }
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
.g-bar i { display: block; height: 100%; border-radius: 6px; background: var(--med-accent, var(--med-blue)); }
.g-bar.b-ok i { background: linear-gradient(90deg, var(--med-accent, var(--med-blue)), var(--med-green)); }
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
      const date = d === null ? "—" : new Date(ssl.state).toLocaleDateString(cardLocale(), { day: "2-digit", month: "2-digit", year: "2-digit" });
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

    const sec = (icon, title, right, body) => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${esc(icon)}"></ha-icon>${title}${right ? `<span class="maj-r">${right}</span>` : ""}</div>${body}</div>` : "");
    const body = [
      c.show_system !== false ? sec("mdi:update", "Mises à jour système", "", sysTiles.length ? `<div class="maj-grid3">${sysTiles.join("")}</div>` : "") : "",
      c.show_info !== false ? sec("mdi:information-outline", "Informations", "", info.length ? `<div class="maj-grid2">${info.join("")}</div>` : "") : "",
      c.show_apps !== false ? sec("mdi:application-outline", "Applications", apps.length ? (nUpd ? `<b class="maj-cnt">${nUpd} mise${nUpd > 1 ? "s" : ""} à jour</b>` : "tout est à jour") : "", appTiles.length ? `<div class="maj-apps">${appTiles.join("")}</div>` : "") : "",
    ].join("");

    const sub = [c.subtitle, ver(core) ? `Core ${ver(core)}` : null].filter(Boolean).map(esc).join(" · ");
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${MAJ_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)}">
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
.maj-info ha-icon { --mdc-icon-size: 26px; color: var(--med-accent, var(--med-blue)); flex: none; }
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
.maj-ico ha-icon { --mdc-icon-size: 30px; color: var(--med-accent, var(--med-blue)); }
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

/** Capteurs NUT d'un onduleur : appareil choisi (ups_device), sinon le premier trouvé. */
const nutMap = (hass, c) => {
  const reg = hass.entities || {}, ids = Object.keys(hass.states || {});
  const key = (id) => reg[id]?.translation_key;
  const nut = ids.filter((id) => reg[id]?.platform === "nut" && id.startsWith("sensor."));
  const upsDev = c.ups_device || reg[nut[0]]?.device_id;
  const pool = nut.filter((id) => !upsDev || reg[id]?.device_id === upsDev);
  const src = pool.length ? pool : ids.filter((id) => /^sensor\.ups_/.test(id));
  const out = {}, used = new Set();
  for (const [f, d] of Object.entries(NAS_UPS)) {
    const id = (c.ups || {})[f] || src.find((x) => !used.has(x) && d.k.includes(key(x))) || src.find((x) => !used.has(x) && !key(x) && d.re.test(x));
    if (id) { out[f] = id; used.add(id); }
  }
  return out;
};

/** Section Onduleur (cartes NAS et Proxmox) : état secteur ou batterie, tensions, charge, batterie. */
const upsBlock = (card, u, c) => {
  if (!Object.keys(u).length) return { html: "", ok: null };
  const st = card._txt(u.status), raw = card._txt(u.status_raw);
  const ok = !u.status && !u.status_raw ? null : (raw ? /\bOL\b/.test(raw) && !/\b(OB|LB|RB|OVER)\b/.test(raw) : /online|en ligne/i.test(st || ""));
  const bar = (id, icon, label, max, cls) => {
    const v = card._num(id);
    return v === null ? "" : `<div class="srv-g ${cls}" data-entity="${esc(id)}"><div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${fmt(v, 0)}<small> ${esc(card._unit(id, ""))}</small></b></div>
      <div class="g-bar"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i></div></div>`;
  };
  const batt = card._num(u.battery);
  const hass = card._hass;
  const dev = hass.devices?.[hass.entities?.[u.status || u.status_raw || u.battery]?.device_id];
  const name = c.ups_name || [dev?.manufacturer, dev?.model].filter(Boolean).join(" ") || dev?.name || "Onduleur";
  const run = card._num(u.runtime);
  const html = `<div class="srv-state ${ok === null ? "" : ok ? "ok" : "bad"} nas-ups" data-entity="${esc(u.status || u.status_raw || "")}">
      <ha-icon icon="mdi:power-plug-battery-outline"></ha-icon><span>${esc(name)}</span><b>${esc([fr(st), raw].filter(Boolean).join(" · ") || "—")}</b></div>
    <div class="srv-grid nas-ups-g">${[
      bar(u.input, "mdi:transmission-tower-import", "Entrée", 250, "nas-in"),
      bar(u.output, "mdi:transmission-tower-export", "Sortie", 250, "srv-in"),
      bar(u.load, "mdi:gauge", "Charge", 100, "nas-load"),
      batt === null ? "" : `<div class="srv-g" data-entity="${esc(u.battery)}"><div class="srv-gt"><span><ha-icon icon="mdi:battery"></ha-icon>Batterie</span><b>${fmt(batt, 0)}<small> %</small></b></div>
        <div class="g-bar ${batt >= 50 ? "b-ok" : batt >= 20 ? "b-warn" : "b-alert"}"><i style="width:${batt}%"></i></div>${run !== null && card._unit(u.runtime, "s") === "s" ? `<div class="srv-gs">Autonomie ${Math.round(run / 60)} min</div>` : ""}</div>`,
    ].join("")}</div>`;
  return { html, ok };
};

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
    return cleanUnit(this._st(id)?.attributes?.unit_of_measurement ?? d);
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

    const sec = (icon, t, body) => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${esc(icon)}"></ha-icon>${t}</div>${body}</div>` : "");
    const kv = (rows) => rows.filter(([, v]) => v !== null && v !== undefined).map(([k, v, cls]) => `<div class="srv-kv"><span>${k}</span><b class="${cls || ""}">${esc(v)}</b></div>`).join("");

    // --- informations
    const boot = this._txt(m.last_boot);
    // DSM : version installée et mise à jour disponible
    const upd = this._st(m.dsm_update);
    const short = (v) => (/\d+(?:\.\d+)+/.exec(v || "") || [v || null])[0]; // « DSM 7.2.2-72806 Update 3 » → « 7.2.2 »
    const inst = upd?.attributes?.installed_version, last = upd?.attributes?.latest_version;
    const dsmTile = upd && upd.state !== "unavailable" ? `<div class="tile srv-t nas-dsm ${upd.state === "on" ? "up" : ""}" data-entity="${esc(m.dsm_update)}" title="${esc([inst, upd.state === "on" ? `→ ${last}` : ""].filter(Boolean).join(" "))}"><div class="tile-l"><ha-icon icon="${esc(upd.state === "on" ? "mdi:package-up" : "mdi:package-check")}"></ha-icon>DSM</div>
        ${kv([["Version", short(inst)], upd.state === "on" ? ["Dispo", short(last) || "Oui", "bad"] : ["État", "À jour", "ok"]])}</div>` : "";
    const info = [
      ip || ipExt ? `<div class="tile srv-t" data-entity="${esc(m.tracker || "")}"><div class="tile-l"><ha-icon icon="mdi:ip-network-outline"></ha-icon>Réseau</div>${kv([["Interne", ip || "—"], ["Externe", ipExt || null]])}</div>` : "",
      m.volumes.length || m.security ? `<div class="tile srv-t nas-health ${hddOk === false || secOk === false ? "bad" : ""}" data-panel="1" title="Afficher l'état des disques">
        <div class="tile-l"><ha-icon icon="${esc(hddOk === false ? "mdi:shield-alert-outline" : "mdi:shield-check-outline")}"></ha-icon>Santé<ha-icon class="nas-chev" icon="mdi:chevron-${this._open ? "up" : "down"}"></ha-icon></div>
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
        <div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${fmt(v, digits)}<small>${unit}</small></b></div>
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
      return `<div class="tile srv-b nas-th ${cls}" data-entity="${esc(id)}"><ha-icon icon="${esc(icon)}"></ha-icon><div class="tile-l">${label}</div><div class="srv-bv">${fmt(v, 0)} ${esc(this._unit(id, "°C"))}</div></div>`;
    };
    const fanSt = this._txt(m.fan);
    const fanFr = fanSt ? ({ quiet: "Silencieux", cool: "Frais", full_speed: "Vitesse max", full: "Vitesse max", low_power: "Économie" }[fanSt] || fanSt) : null;
    const thermal = [
      tTile(m.temperature, "mdi:nas", "NAS"),
      ...m.drives.map((d) => tTile(d.drv_temp, "mdi:harddisk", `Disque ${d.n}`)),
      m.fan ? `<div class="tile srv-b" data-entity="${esc(m.fan)}" data-hold="${esc(m.fan)}" title="Appui long : mode suivant"><ha-icon icon="${esc(fanSt === "quiet" ? "mdi:fan-speed-1" : fanSt === "cool" ? "mdi:fan-speed-2" : "mdi:fan-speed-3")}"></ha-icon><div class="tile-l">Ventilateur</div><div class="srv-bv nas-sm">${esc(fanFr || "—")}</div></div>` : "",
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
      return `<div class="srv-g ${cls}" data-entity="${esc(id)}"><div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${v !== null ? fmt(v, v < 10 ? 1 : 0) : "—"}<small> ${esc(unit)}</small></b></div>
        <div class="g-bar"><i style="width:${mb === null ? 0 : Math.min(100, (mb / netMax) * 100)}%"></i></div></div>`;
    };
    const nets = [net(m.net_down, "mdi:download", "Download", "srv-in"), net(m.net_up, "mdi:upload", "Upload", "srv-out")].filter(Boolean);

    // --- onduleur
    let ups = "";
    if (Object.keys(m.ups).length) {
      const bar = (id, icon, label, max, cls) => {
        const v = this._num(id);
        return v === null ? "" : `<div class="srv-g ${cls}" data-entity="${esc(id)}"><div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${fmt(v, 0)}<small> ${esc(this._unit(id, ""))}</small></b></div>
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
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${NAS_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${alertCls}">
      <header>
        <div class="brand" ${c.navigation_path ? `data-nav="${esc(c.navigation_path)}"` : `data-entity="${esc(m.tracker || m.cpu || "")}"`} style="cursor:pointer">
          <ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:nas")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
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
.nas-drv-h ha-icon { --mdc-icon-size: 18px; color: var(--med-accent, var(--med-blue)); }
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
.nas-in .g-bar i { background: var(--med-accent, var(--med-blue)); }
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
  show_ups: true, // section Onduleur, quand un onduleur NUT est trouvé
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

  _txt(id) {
    const s = this._st(id)?.state;
    return s === undefined || s === "unavailable" || s === "unknown" || s === "" ? null : s;
  }

  _unit(id, d = "") {
    return cleanUnit(this._st(id)?.attributes?.unit_of_measurement ?? d);
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
    this._map = { nodes: list, guests, storages, ups: c.show_ups !== false ? nutMap(hass, c) : {} };
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
    const ids = [...[...m.nodes, ...m.guests, ...m.storages].flatMap((d) => Object.values(d.roles)), ...Object.values(m.ups || {})];
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
    const ups = upsBlock(this, m.ups || {}, c);
    const leds = m.nodes.length ? [
      led(!down.length, `Nœuds ${m.nodes.filter((n) => !n.other).length - down.length}/${m.nodes.filter((n) => !n.other).length}`, (down[0] || m.nodes[0]).roles.status),
      updates.length ? `<span class="srv-led upd" data-entity="${esc(updates[0].roles.update)}"><i></i>Mise à jour</span>` : "",
      ups.ok === null ? "" : led(ups.ok, "UPS", m.ups.status || m.ups.status_raw),
    ].join("") : "";

    const sec = (icon, t, body, extra = "") => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${esc(icon)}"></ha-icon>${t}${extra}</div>${body}</div>` : "");
    const gauge = (id, icon, label, v, sub, warn = 75, alert = 90) => (v === null ? "" : `<div class="srv-g" data-entity="${esc(id)}">
        <div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${fmt(v, 0)}<small> %</small></b></div>
        <div class="g-bar ${level(v, warn, alert)}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>${sub ? `<div class="srv-gs">${sub}</div>` : ""}</div>`);
    const btn = (id, icon, label, cls = "") => {
      if (!id || !this._st(id)) return "";
      const armed = this._armed === id;
      // armé : coche orange (petits boutons), « Confirmer » sur les grands boutons du nœud
      return `<button class="pve-btn ${cls} ${armed ? "armed" : ""}" data-press="${esc(id)}" title="${esc(armed ? `${label} : cliquez encore pour confirmer` : label)}" aria-label="${esc(armed ? `Confirmer : ${label}` : label)}"><ha-icon icon="${esc(armed ? "mdi:check-bold" : icon)}"></ha-icon>${armed && /wide/.test(cls) ? "<span>Confirmer</span>" : ""}</button>`;
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
          `<div class="tile srv-t" data-entity="${esc(node.roles.status || node.roles.running || "")}"><div class="tile-l"><ha-icon icon="mdi:server"></ha-icon>${esc(node.name)}</div><div class="pve-st ${stCls}"><i></i>${esc(stTxt)}</div></div>`,
          boot && since(boot) ? `<div class="tile srv-t" data-entity="${esc(node.roles.uptime)}"><div class="tile-l"><ha-icon icon="mdi:clock-start"></ha-icon>Uptime</div><div class="nas-up">${esc(since(boot))}</div></div>` : "",
          upd ? `<div class="tile srv-t nas-dsm ${upd.state === "on" ? "up" : ""}" data-entity="${esc(node.roles.update)}" title="${esc([inst, upd.state === "on" ? `→ ${last}` : ""].filter(Boolean).join(" "))}"><div class="tile-l"><ha-icon icon="${esc(upd.state === "on" ? "mdi:package-up" : "mdi:package-check")}"></ha-icon>Proxmox</div>
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
          <ha-icon class="pve-gi" icon="${esc(g.vm ? "mdi:monitor" : "mdi:cube-outline")}" title="${g.vm ? "Machine virtuelle" : "Conteneur LXC"}"></ha-icon>
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
        + sec("mdi:power-plug-battery-outline", "Onduleur", ups.html)
        + sec("mdi:gesture-tap-button", "Actions du nœud", nodeActs.length ? `<div class="pve-na">${nodeActs.join("")}</div>${guard ? `<div class="srv-gs pve-guard"><ha-icon icon="mdi:shield-lock-outline"></ha-icon>Redémarrage et arrêt masqués : ce nœud fait tourner Home Assistant.</div>` : ""}` : "");
    }

    const alertCls = down.length || ups.ok === false ? "srv-alert" : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${NAS_STYLE}${PVE_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${alertCls}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:server-network")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
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
.pve-tab.on { border-color: var(--med-accent, var(--med-blue)); box-shadow: inset 0 -2px 0 var(--med-accent, var(--med-blue)); }
.pve-tab:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); }
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
.pve-gi { --mdc-icon-size: 20px; color: var(--med-accent, var(--med-blue)); }
.pve-gn { min-width: 0; display: grid; }
.pve-gn b { font-size: .86rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pve-gn span { display: flex; align-items: center; gap: 5px; font-size: .72rem; color: var(--med-muted); white-space: nowrap; overflow: hidden; }
.pve-gm { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; text-align: right; font-size: .8rem; font-weight: 600; }
.pve-gh .pve-gm { font-weight: 500; }
.pve-ga { display: flex; gap: 4px; justify-content: flex-end; min-width: 30px; }
.pve-btn { all: unset; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 30px; height: 30px; padding: 0 6px; box-sizing: border-box;
  border-radius: 9px; border: 1px solid var(--med-line); color: var(--med-muted); font-size: .74rem; font-weight: 700; }
.pve-btn ha-icon { --mdc-icon-size: 17px; }
.pve-btn:hover { border-color: var(--med-accent, var(--med-blue)); color: var(--med-text); }
.pve-btn:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); }
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

/* ------------------------------------------------------------ carte OpenMediaVault */

const OMV_DEFAULTS = {
  title: "",
  icon: "mdi:nas",
  icon_color: "",
  net_max: 1000, // Mbit/s, pleine échelle des barres réseau
  temp_warn: 45, temp_alert: 55, // °C, disques et processeur
  show_system: true, show_storage: true, show_disks: true, show_services: true, show_network: true, show_actions: true,
  show_ups: true, // section Onduleur, quand un onduleur NUT est trouvé
  theme: "v2",
};

/** Rôles des entités de l'appareil principal (intégration OpenMediaVault « omv ») : fin de l'identifiant. */
const OMV_HUB = [
  ["cpu", "sensor", /_cpu_(utilization|usage)$|_utilisation_du_processeur$/],
  ["cpu_temp", "sensor", /_cpu_temperature$|_temperature_du_processeur$/],
  ["mem", "sensor", /_memory_usage$|_utilisation_de_la_memoire$/],
  ["mem_total", "sensor", /_memory_total$|_memoire_totale$/],
  ["mem_used", "sensor", /_memory_used$|_memoire_utilisee$/],
  ["uptime", "sensor", /_uptime$|_temps_de_fonctionnement$/],
  ["pkg", "sensor", /_available_package_updates$|_mises_a_jour_disponibles$/],
  ["load1", "sensor", /_load_average_1_min$/],
  ["load5", "sensor", /_load_average_5_min$/],
  ["load15", "sensor", /_load_average_15_min$/],
  ["reboot_req", "binary_sensor", /_reboot_required$|_redemarrage_requis$/],
  ["reachable", "binary_sensor", /_reachable$|_joignable$/],
  ["reboot", "button", /_reboot$|_redemarrer$/],
  ["shutdown", "button", /_shutdown$|_arreter$|_eteindre$/],
  ["standby", "button", /_standby$|_veille$/],
  ["update", "update", /./],
];
/** État SMART d'OpenMediaVault en français. */
const OMV_SMART = { good: ["Bon", "ok"], passed: ["Bon", "ok"], ok: ["Bon", "ok"], bad: ["Mauvais", "bad"], failed: ["En échec", "bad"], warning: ["Attention", "warn"] };

class ServeurHaOmvCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-omv-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...OMV_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const press = ev.target.closest?.("[data-press]");
        if (press) {
          // Redémarrer, éteindre, veille, allumer : premier clic arme, second clic dans les 5 s confirme
          ev.stopPropagation();
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

  _txt(id) {
    const s = this._st(id)?.state;
    return s === undefined || s === "unavailable" || s === "unknown" || s === "" ? null : s;
  }

  _unit(id, d = "") {
    return cleanUnit(this._st(id)?.attributes?.unit_of_measurement ?? d);
  }

  /** Appareil OpenMediaVault (choisi ou le premier), ses disques et systèmes de fichiers, services et interfaces réseau. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass, c = this._config;
    const reg = hass.entities || {}, devs = hass.devices || {};
    const all = Object.entries(reg).filter(([id, e]) => e.platform === "omv" && hass.states[id] && !e.hidden);
    // appareil principal : celui choisi, sinon celui qui porte l'utilisation du processeur
    const hubId = c.device || all.find(([id]) => OMV_HUB[0][2].test(id))?.[1].device_id || all.find(([, e]) => !devs[e.device_id]?.via_device_id)?.[1].device_id;
    const hub = { roles: {}, services: [], ifaces: {} };
    const children = {};
    for (const [id, e] of all) {
      const domain = id.split(".")[0];
      if (e.device_id === hubId) {
        const role = OMV_HUB.find(([, d, re]) => d === domain && re.test(id));
        if (role && !hub.roles[role[0]]) { hub.roles[role[0]] = id; continue; }
        const st = hass.states[id];
        if (domain === "binary_sensor" && (st.attributes?.device_class === "running" || /_service$/.test(id))) { hub.services.push(id); continue; }
        const net = /_([a-z0-9]+)_(tx|rx)$/.exec(id);
        if (domain === "sensor" && net && /bit\/s|B\/s/i.test(st.attributes?.unit_of_measurement || "")) (hub.ifaces[net[1]] ||= {})[net[2]] = id;
      } else if (devs[e.device_id]?.via_device_id === hubId || !hubId) {
        (children[e.device_id] ||= []).push(id);
      }
    }
    // disques : température, SMART, secteurs défectueux, erreurs CRC ; espaces utilisés en % (partitions de préférence)
    const disks = [], fs = [];
    for (const [devId, ids] of Object.entries(children)) {
      const dev = devs[devId] || {};
      const short = (/\[([^\]]+)\]/.exec(dev.name || "") || [, dev.name_by_user || dev.name || "Disque"])[1];
      const d = { id: devId, short, model: (dev.name_by_user || dev.name || "").replace(/\s*\[[^\]]+\]\s*$/, ""), roles: {} };
      const used = [];
      for (const id of ids) {
        const st = hass.states[id];
        if (st.attributes?.device_class === "temperature") d.roles.temp ||= id;
        else if (/_smart_status$|_etat_smart$/.test(id)) d.roles.smart ||= id;
        else if (/_bad_sectors$|_secteurs_defectueux$/.test(id)) d.roles.bad ||= id;
        else if (/_crc_errors$|_erreurs_crc$/.test(id)) d.roles.crc ||= id;
        else if (id.startsWith("sensor.") && /_used$|_utilise$/.test(id) && st.attributes?.unit_of_measurement === "%") used.push(id);
      }
      // nom de l'espace : dans le nom affiché (« sdb1 used % ») ; un disque entier est ignoré quand ses partitions sont là
      const nameOf = (id) => String(hass.states[id].attributes?.friendly_name || id).replace(dev.name || "", "").replace(/\s*(used|utilisé)\s*%?\s*$/i, "").trim() || short;
      const names = used.map((id) => ({ id, name: nameOf(id), base: id.replace(/_(used|utilise)$/, "") }));
      for (const u of names) {
        if (names.some((o) => o !== u && o.name.length > u.name.length && o.name.startsWith(u.name))) continue;
        fs.push({ ...u, used_size: `${u.base}_used_size`, total_size: `${u.base}_total_size`, disk: short });
      }
      if (d.roles.temp || d.roles.smart || d.roles.bad || d.roles.crc) disks.push(d);
    }
    const byName = (a, b) => String(a.short || a.name).localeCompare(String(b.short || b.name), "fr", { numeric: true });
    disks.sort(byName); fs.sort(byName);
    this._map = { hubId, dev: devs[hubId], hub, disks, fs, ups: c.show_ups !== false ? nutMap(hass, c) : {} };
    return this._map;
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    const r = m.hub.roles;
    const ids = [...Object.values(r), ...m.hub.services, ...Object.values(m.hub.ifaces).flatMap((x) => Object.values(x)),
      ...m.disks.flatMap((d) => Object.values(d.roles)), ...m.fs.flatMap((f) => [f.id, f.used_size, f.total_size]), ...Object.values(m.ups || {}), c.power_on];
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${this._armed}|${Math.floor(Date.now() / 60000)}|` + ids.map((id) => this._st(id)?.state ?? "-").join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const sec = (icon, t, body) => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${esc(icon)}"></ha-icon>${t}</div>${body}</div>` : "");
    const kv = (rows) => rows.filter(([, v]) => v !== null && v !== undefined).map(([k, v, cls]) => `<div class="srv-kv"><span>${k}</span><b class="${cls || ""}">${esc(v)}</b></div>`).join("");
    const gauge = (id, icon, label, v, sub, warn = 75, alert = 90, unit = " %", max = 100, digits = 0) => (v === null ? "" : `<div class="srv-g" data-entity="${esc(id)}">
        <div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${fmt(v, digits)}<small>${unit}</small></b></div>
        <div class="g-bar ${level((v / max) * 100, warn, alert)}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i></div>${sub ? `<div class="srv-gs">${sub}</div>` : ""}</div>`);
    const btn = (id, icon, label, cls = "") => {
      if (!id || !this._st(id)) return "";
      const armed = this._armed === id;
      return `<button class="pve-btn wide ${cls} ${armed ? "armed" : ""}" data-press="${esc(id)}" title="${esc(armed ? `${label} : cliquez encore pour confirmer` : label)}" aria-label="${esc(armed ? `Confirmer : ${label}` : label)}"><ha-icon icon="${esc(armed ? "mdi:check-bold" : icon)}"></ha-icon>${armed ? "<span>Confirmer</span>" : ""}</button>`;
    };
    const size = (id) => { const v = this._num(id); if (v === null) return null; const u = this._unit(id, "GB"); return v >= 1000 && /^GB$/i.test(u) ? `${fmt(v / 1000, 2)} To` : `${fmt(v, v < 10 ? 1 : 0)} ${u.replace(/^GB$/i, "Go").replace(/^TB$/i, "To").replace(/^MB$/i, "Mo")}`; };

    const reach = this._st(r.reachable);
    const online = reach ? reach.state === "on" : this._txt(r.cpu) !== null;
    const dev = m.dev || {};
    const host = (/\(([^)]+)\)/.exec(dev.name || "") || [, dev.name_by_user || dev.name || ""])[1];
    const cfgHost = (() => { try { return dev.configuration_url ? new URL(dev.configuration_url).hostname : null; } catch (e) { return null; } })();
    const ip = c.ip || cfgHost || null;
    const version = dev.sw_version || this._st(r.update)?.attributes?.installed_version || null;

    // --- voyants
    const disksBad = m.disks.some((d) => { const s = String(this._txt(d.roles.smart) || "").toLowerCase(); return (s && OMV_SMART[s]?.[1] === "bad") || this._st(d.roles.bad)?.state === "on" || this._st(d.roles.crc)?.state === "on"; });
    const upd = this._st(r.update);
    const pkg = this._num(r.pkg);
    const needUpd = upd?.state === "on" || (pkg !== null && pkg > 0);
    const rebootReq = this._st(r.reboot_req)?.state === "on";
    const ups = upsBlock(this, m.ups || {}, c);
    const led = (ok, label, id, cls = "") => `<span class="srv-led ${ok ? "ok" : "bad"} ${cls}" data-entity="${esc(id || "")}"><i></i>${label}</span>`;
    const leds = m.hubId ? [
      led(online, "OMV", r.reachable || r.cpu),
      m.disks.length ? led(!disksBad, "Disques", m.disks[0].roles.smart || m.disks[0].roles.temp) : "",
      needUpd ? `<span class="srv-led upd" data-entity="${esc(r.update || r.pkg || "")}"><i></i>Mise à jour</span>` : "",
      rebootReq ? `<span class="srv-led upd" data-entity="${esc(r.reboot_req)}"><i></i>Redémarrage requis</span>` : "",
      ups.ok === null ? "" : led(ups.ok, "UPS", m.ups.status || m.ups.status_raw),
    ].join("") : "";

    let body = "";
    if (!m.hubId) {
      body = `<div class="empty">Aucun OpenMediaVault trouvé<span>Installez l'intégration OpenMediaVault (HACS, dépôt SlyBase/homeassistant-openmediavault), ajoutez-la dans Paramètres › Appareils et services, puis rechargez la page.</span></div>`;
    } else {
      // --- système
      let system = "";
      if (c.show_system !== false) {
        const boot = online ? this._txt(r.uptime) : null;
        const inst = upd?.attributes?.installed_version || version;
        const short = (v) => (/\d+(?:\.\d+)+/.exec(v || "") || [v || null])[0]; // « 7.7.24-7 (Sandworm) » → « 7.7.24 »
        const loads = [r.load1, r.load5, r.load15].map((id) => this._num(id));
        const tiles = [
          boot && since(boot) ? `<div class="tile srv-t" data-entity="${esc(r.uptime)}"><div class="tile-l"><ha-icon icon="mdi:clock-start"></ha-icon>Uptime</div><div class="nas-up">${esc(since(boot))}</div></div>` : "",
          upd || pkg !== null ? `<div class="tile srv-t nas-dsm ${needUpd ? "up" : ""}" data-entity="${esc(r.update || r.pkg)}" title="${esc(inst || "")}"><div class="tile-l"><ha-icon icon="${esc(needUpd ? "mdi:package-up" : "mdi:package-check")}"></ha-icon>OMV</div>
            ${kv([["Version", short(inst)], needUpd ? ["Paquets", pkg !== null && pkg > 0 ? fmt(pkg, 0) : "Oui", "bad"] : ["État", "À jour", "ok"]])}</div>` : "",
          loads.some((v) => v !== null) ? `<div class="tile srv-t" data-entity="${esc(r.load1 || r.load5)}"><div class="tile-l"><ha-icon icon="mdi:chart-line-variant"></ha-icon>Charge</div>
            <div class="omv-load">${loads.map((v, i) => `<span><b>${v === null ? "—" : fmt(v, 2)}</b><small>${[1, 5, 15][i]} min</small></span>`).join("")}</div></div>` : "",
        ].filter(Boolean);
        const memTotal = this._num(r.mem_total), memUsed = this._num(r.mem_used), memPct = this._num(r.mem) ?? (memUsed !== null && memTotal ? (memUsed / memTotal) * 100 : null);
        const mo = (v) => (v === null ? null : v >= 1024 ? `${fmt(v / 1024, 1)} Go` : `${fmt(v, 0)} Mo`);
        const temp = this._num(r.cpu_temp);
        const res = [
          gauge(r.cpu, "mdi:cpu-64-bit", "CPU", this._num(r.cpu), "", 70, 90),
          gauge(r.mem || r.mem_used, "mdi:memory", "RAM", memPct, memUsed !== null && memTotal !== null ? `${mo(memUsed)} / ${mo(memTotal)}` : "", 80, 92),
          temp !== null ? gauge(r.cpu_temp, "mdi:thermometer", "Température", temp, "", c.temp_warn, c.temp_alert, ` ${esc(this._unit(r.cpu_temp, "°C"))}`, 100) : "",
        ].filter(Boolean);
        system = sec("mdi:information-outline", "Système", `${tiles.length ? `<div class="tiles srv-tiles">${tiles.join("")}</div>` : ""}${res.length ? `<div class="srv-grid pve-res">${res.join("")}</div>` : ""}`);
      }

      // --- systèmes de fichiers
      const fsHtml = c.show_storage !== false ? m.fs.map((f) => {
        const used = size(f.used_size), total = size(f.total_size);
        return gauge(f.id, "mdi:harddisk", esc(f.name), this._num(f.id), used && total ? `${used} / ${total}` : "", 80, 90);
      }).filter(Boolean) : [];

      // --- disques
      const diskHtml = c.show_disks !== false ? m.disks.map((d) => {
        const t = this._num(d.roles.temp);
        const s = String(this._txt(d.roles.smart) || "").toLowerCase();
        const [sTxt, sCls] = s ? OMV_SMART[s] || [this._txt(d.roles.smart), ""] : [null, ""];
        const flag = (id) => { const v = this._st(id)?.state; return v === "on" ? ["Alerte", "bad"] : v === "off" ? ["OK", "ok"] : null; };
        const bad = flag(d.roles.bad), crc = flag(d.roles.crc);
        const hot = t !== null && t >= c.temp_alert ? "bad" : t !== null && t >= c.temp_warn ? "warn" : "";
        const alert = sCls === "bad" || bad?.[1] === "bad" || crc?.[1] === "bad";
        return `<div class="tile srv-t omv-disk ${alert ? "bad" : hot}" data-entity="${esc(d.roles.smart || d.roles.temp || "")}" title="${esc(d.model)}">
          <div class="tile-l"><ha-icon icon="mdi:harddisk"></ha-icon>${esc(d.short)}${t !== null ? `<b class="omv-t ${hot}">${fmt(t, 0)} ${esc(this._unit(d.roles.temp, "°C"))}</b>` : ""}</div>
          <div class="omv-model">${esc(d.model)}</div>
          ${kv([["SMART", sTxt, sCls], ["Secteurs défectueux", bad?.[0] ?? null, bad?.[1]], ["Erreurs CRC", crc?.[0] ?? null, crc?.[1]]])}</div>`;
      }) : [];

      // --- services
      const devName = dev.name || "";
      const svc = c.show_services !== false ? m.hub.services.map((id) => {
        const st = this._st(id);
        const on = st.state === "on";
        const name = String(st.attributes?.friendly_name || id).replace(devName, "").replace(/\s*(service|serveur)\s*$/i, "").replace(/\s*service\s*/i, " ").trim();
        return `<span class="omv-svc ${on ? "on" : ""}" data-entity="${esc(id)}" title="${on ? "En cours" : "Arrêté"}"><i></i>${esc(name)}</span>`;
      }) : [];

      // --- réseau
      const netMax = Number(c.net_max) || 1000;
      const nets = c.show_network !== false ? Object.entries(m.hub.ifaces).flatMap(([name, x]) => [
        x.rx ? gauge(x.rx, "mdi:download", "Download", this._num(x.rx), esc(name), 101, 101, ` ${esc(this._unit(x.rx, "Mbit/s"))}`, netMax, this._num(x.rx) < 10 ? 2 : 0).replace('class="srv-g"', 'class="srv-g srv-in"') : "",
        x.tx ? gauge(x.tx, "mdi:upload", "Upload", this._num(x.tx), esc(name), 101, 101, ` ${esc(this._unit(x.tx, "Mbit/s"))}`, netMax, this._num(x.tx) < 10 ? 2 : 0).replace('class="srv-g"', 'class="srv-g srv-out"') : "",
      ]).filter(Boolean) : [];

      // --- actions : allumé → redémarrer, veille, éteindre ; éteint → allumer (option power_on)
      const acts = c.show_actions !== false ? (online
        ? [btn(r.reboot, "mdi:restart", "Redémarrer"), btn(r.standby, "mdi:power-sleep", "Veille"), btn(r.shutdown, "mdi:power", "Éteindre", "stop")]
        : [btn(c.power_on, "mdi:power", "Allumer", "go")]).filter(Boolean) : [];

      body = system
        + sec("mdi:folder-network-outline", "Systèmes de fichiers", fsHtml.length ? `<div class="srv-grid pve-res">${fsHtml.join("")}</div>` : "")
        + sec("mdi:harddisk", "Disques", diskHtml.length ? `<div class="tiles srv-tiles omv-disks">${diskHtml.join("")}</div>` : "")
        + sec("mdi:cog-outline", `Services <small class="pve-n">${svc.length ? `${m.hub.services.filter((id) => this._st(id)?.state === "on").length}/${svc.length} en cours` : ""}</small>`, svc.length ? `<div class="omv-svcs">${svc.join("")}</div>` : "")
        + sec("mdi:swap-vertical", "Débits réseau", nets.length ? `<div class="srv-grid">${nets.join("")}</div>` : "")
        + sec("mdi:power-plug-battery-outline", "Onduleur", ups.html)
        + sec("mdi:gesture-tap-button", "Actions", acts.length ? `<div class="pve-na">${acts.join("")}</div>` : "");
    }

    const alertCls = (m.hubId && !online) || disksBad || ups.ok === false ? "srv-alert" : "";
    const sub = [online ? "En ligne" : m.hubId ? "Hors ligne" : "OpenMediaVault", version ? `OMV ${(/\d+(?:\.\d+)+(?:-\d+)?/.exec(version) || [version])[0]}` : null].filter(Boolean).join(" · ");
    const sub2 = [ip, host && host !== ip ? host : null].filter(Boolean).join(" · ");
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${NAS_STYLE}${PVE_STYLE}${OMV_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${alertCls}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:nas")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
          <div><div class="title">${esc(c.title || "OpenMediaVault")}</div><div class="sub">${esc(sub)}</div>${sub2 ? `<div class="sub">${esc(sub2)}</div>` : ""}</div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const OMV_STYLE = `<style>
.omv-load { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 4px; }
.omv-load span { display: grid; min-width: 0; } .omv-load b { font-size: .9rem; } .omv-load small { font-size: .62rem; color: var(--med-muted); white-space: nowrap; }
.omv-disks { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.omv-disk .tile-l { width: 100%; }
.omv-t { margin-left: auto; font-size: .9rem; color: var(--med-down); }
.omv-t.warn { color: #f0a33a; } .omv-t.bad { color: var(--t-red); }
.omv-disk.warn { border-color: #f0a33a; } .omv-disk.bad { border-color: var(--t-red); }
.omv-model { font-size: .7rem; color: var(--med-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 2px 0 4px; }
.omv-svcs { display: flex; flex-wrap: wrap; gap: 6px; }
.omv-svc { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; cursor: pointer; font-size: .8rem; font-weight: 600;
  border: 1px solid var(--med-line); background: var(--med-surface); color: var(--med-muted); }
.omv-svc i { width: 8px; height: 8px; border-radius: 50%; background: var(--med-muted); }
.omv-svc.on { color: var(--med-text); border-color: color-mix(in srgb, var(--med-down) 45%, transparent); }
.omv-svc.on i { background: var(--med-down); }
</style>`;

/* ------------------------------------------------------------ carte routeur ASUS (AsusRouter) */

const ASUS_DEFAULTS = {
  title: "",
  icon: "mdi:router-wireless",
  icon_color: "",
  wan_max: 1000, // Mbit/s, pleine échelle des barres Internet
  wifi_max: 300, // Mbit/s, pleine échelle des barres Wi-Fi et filaire
  temp_warn: 80, temp_alert: 95, // °C, processeur et radios
  show_system: true, show_internet: true, show_wifi: true, show_ports: true, show_clients: true, show_vpn: true, show_actions: true,
  latest: 5, // derniers appareils connectés affichés
  theme: "v2",
};

/** Rôles des entités du routeur (intégration AsusRouter « asusrouter ») : domaine et fin de l'identifiant. */
const ASUS_ROLES = [
  ["cpu", "sensor", /(?<!_temperature)_cpu$/],
  ["ram", "sensor", /_ram$/],
  ["uptime", "sensor", /_uptime$/],
  ["boot", "sensor", /_boot_time$/],
  ["load1", "sensor", /_load_average_1_min$/],
  ["load5", "sensor", /_load_average_5_min$/],
  ["load15", "sensor", /_load_average_15_min$/],
  ["t_cpu", "sensor", /_temperature_cpu$/],
  ["t_24", "sensor", /_temperature_2_4_ghz$/],
  ["t_5", "sensor", /_temperature_5_ghz$/],
  ["t_52", "sensor", /_temperature_5_ghz_2$/],
  ["t_6", "sensor", /_temperature_6_ghz$/],
  ["wan_rx", "sensor", /_wan_download_speed$/],
  ["wan_tx", "sensor", /_wan_upload_speed$/],
  ["wan_rx_total", "sensor", /_wan_download$/],
  ["wan_tx_total", "sensor", /_wan_upload$/],
  ["w24_rx", "sensor", /_2_4_ghz_download_speed$/],
  ["w24_tx", "sensor", /_2_4_ghz_upload_speed$/],
  ["w5_rx", "sensor", /_5_ghz_download_speed$/],
  ["w5_tx", "sensor", /_5_ghz_upload_speed$/],
  ["lan_rx", "sensor", /_wired_download_speed$/],
  ["lan_tx", "sensor", /_wired_upload_speed$/],
  ["wan_ip", "sensor", /_wan_ip$/],
  ["clients", "sensor", /_connected_devices$/],
  ["guests", "sensor", /_connected_guestnetwork_devices$/],
  ["latest", "sensor", /_latest_connected$/],
  ["mesh", "sensor", /_aimesh$/],
  ["internet", "binary_sensor", /_internet$/],
  ["wan", "binary_sensor", /(?<!_dual|_port_status)_wan$/],
  ["ports_lan", "binary_sensor", /_port_status_lan$/],
  ["ports_wan", "binary_sensor", /_port_status_wan$/],
  ["wifi24", "switch", /_wireless_2_4_ghz$/],
  ["wifi5", "switch", /_wireless_5_ghz$/],
  ["wifi52", "switch", /_wireless_5_ghz_2$/],
  ["wifi6", "switch", /_wireless_6_ghz$/],
  ["block", "switch", /_block_internet$/],
  ["parental", "switch", /_parental_control$/],
  ["reboot", "button", /_reboot$/],
  ["restart_wifi", "button", /_restart_wireless$/],
  ["refresh", "button", /_refresh_clients$/],
  ["led", "light", /_led$/],
  ["update", "update", /_firmware_update$/],
];
/** Type de connexion d'un appareil (attribut devices de « Connected Devices »). */
const ASUS_LINK = { "2ghz": "Wi-Fi 2,4 GHz", "5ghz": "Wi-Fi 5 GHz", "5ghz2": "Wi-Fi 5 GHz", "6ghz": "Wi-Fi 6 GHz", wired: "Filaire" };

class ServeurHaAsusCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-asus-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...ASUS_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const fold = ev.target.closest?.("[data-fold]");
        if (fold) {
          // débits par bande : déplier ou replier
          ev.stopPropagation();
          this._fold = this._fold === fold.dataset.fold ? null : fold.dataset.fold;
          this._sig = null; this._render(); return;
        }
        const filter = ev.target.closest?.("[data-devs]");
        if (filter) {
          // liste des appareils : « Voir tous » ou une tuile (Wi-Fi 2,4 GHz, 5 GHz, filaire) déplie ou replie la liste
          ev.stopPropagation();
          const f = filter.dataset.devs;
          this._devs = this._devs === f ? null : f;
          this._sig = null; this._render(); return;
        }
        const press = ev.target.closest?.("[data-press]");
        if (press) {
          // Redémarrer, redémarrer le Wi-Fi, LED : premier clic arme, second clic dans les 5 s confirme
          ev.stopPropagation();
          const id = press.dataset.press;
          if (this._armed === id) {
            this._armed = null;
            const domain = id.split(".")[0];
            if (domain === "button") this._hass?.callService("button", "press", { entity_id: id });
            else this._hass?.callService("homeassistant", "toggle", { entity_id: id });
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

  _txt(id) {
    const s = this._st(id)?.state;
    return s === undefined || s === "unavailable" || s === "unknown" || s === "" ? null : s;
  }

  _unit(id, d = "") {
    return cleanUnit(this._st(id)?.attributes?.unit_of_measurement ?? d);
  }

  /** Routeur (choisi ou le premier) : rôles de ses entités, réseaux invités et VPN. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass, c = this._config;
    const reg = hass.entities || {}, devs = hass.devices || {};
    const all = Object.entries(reg).filter(([id, e]) => e.platform === "asusrouter" && hass.states[id] && !e.hidden);
    // routeur : celui choisi, sinon celui qui porte le capteur CPU
    const devId = c.device || all.find(([id]) => /^sensor\..*(?<!_temperature)_cpu$/.test(id))?.[1].device_id || all[0]?.[1].device_id;
    const roles = {}, guests = [], vpns = [];
    for (const [id, e] of all) {
      if (e.device_id !== devId) continue;
      const domain = id.split(".")[0];
      const role = ASUS_ROLES.find(([, d, re]) => d === domain && re.test(id));
      if (role && !roles[role[0]]) { roles[role[0]] = id; continue; }
      if (domain === "switch" && /_guest_(2_4|5|6)_ghz(_\d)?_\d$/.test(id)) guests.push(id);
      else if (domain === "switch" && /_(openvpn|wireguard)_(client|server)_\d$/.test(id)) vpns.push(id);
    }
    const byId = (a, b) => a.localeCompare(b, "fr", { numeric: true });
    this._map = { devId, dev: devs[devId], roles, guests: guests.sort(byId), vpns: vpns.sort(byId) };
    return this._map;
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    const r = m.roles;
    const ids = [...Object.values(r), ...m.guests, ...m.vpns];
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${this._armed}|${this._devs}|${this._fold}|${Math.floor(Date.now() / 60000)}|` + ids.map((id) => { const s = this._st(id); return s ? `${s.state}|${s.last_updated}` : "-"; }).join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const sec = (icon, t, body) => (body ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${esc(icon)}"></ha-icon>${t}</div>${body}</div>` : "");
    const kv = (rows) => rows.filter(([, v]) => v !== null && v !== undefined).map(([k, v, cls]) => `<div class="srv-kv"><span>${k}</span><b class="${cls || ""}">${esc(v)}</b></div>`).join("");
    const gauge = (id, icon, label, v, sub, warn = 75, alert = 90, unit = " %", max = 100, digits = 0) => (v === null ? "" : `<div class="srv-g" data-entity="${esc(id)}">
        <div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${fmt(v, digits)}<small>${unit}</small></b></div>
        <div class="g-bar ${level((v / max) * 100, warn, alert)}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i></div>${sub ? `<div class="srv-gs">${sub}</div>` : ""}</div>`);
    const rate = (id, icon, label, max, sub, cls) => {
      const v = this._num(id);
      return v === null ? "" : gauge(id, icon, label, v, sub, 101, 101, ` ${esc(this._unit(id, "Mbit/s"))}`, max, v < 10 ? 2 : v < 100 ? 1 : 0).replace('class="srv-g"', `class="srv-g ${cls}"`);
    };
    const btn = (id, icon, label, cls = "") => {
      if (!id || !this._st(id)) return "";
      const armed = this._armed === id;
      return `<button class="pve-btn wide ${cls} ${armed ? "armed" : ""}" data-press="${esc(id)}" title="${esc(armed ? `${label} : cliquez encore pour confirmer` : label)}" aria-label="${esc(armed ? `Confirmer : ${label}` : label)}"><ha-icon icon="${esc(armed ? "mdi:check-bold" : icon)}"></ha-icon>${armed ? "<span>Confirmer</span>" : ""}</button>`;
    };
    const chip = (id, label, on, title = "") => `<span class="omv-svc ${on ? "on" : ""}" data-entity="${esc(id)}" title="${esc(title || (on ? "Activé" : "Désactivé"))}"><i></i>${esc(label)}</span>`;
    const go = (v) => (v === null ? null : v >= 1000 ? `${fmt(v / 1000, 2)} To` : `${fmt(v, v < 10 ? 2 : 1)} Go`);

    const dev = m.dev || {};
    const st = (id) => this._st(id);
    const internet = st(r.internet);
    const online = internet ? internet.state === "on" : st(r.wan) ? st(r.wan).state === "on" : null;
    const upd = st(r.update);
    const needUpd = upd?.state === "on";
    const version = dev.sw_version || upd?.attributes?.installed_version || null;
    const meshList = st(r.mesh)?.attributes?.list;
    const routerIp = c.ip || (Array.isArray(meshList) ? meshList.find((n) => n?.type === "router")?.ip : null)
      || (() => { try { return dev.configuration_url ? new URL(dev.configuration_url).hostname : null; } catch (e) { return null; } })();

    // --- voyants
    const led = (ok, label, id) => (ok === null ? "" : `<span class="srv-led ${ok ? "ok" : "bad"}" data-entity="${esc(id || "")}"><i></i>${label}</span>`);
    const leds = m.devId ? [
      led(online, "Internet", r.internet || r.wan),
      st(r.block)?.state === "on" ? `<span class="srv-led bad" data-entity="${esc(r.block)}"><i></i>Internet bloqué</span>` : "",
      needUpd ? `<span class="srv-led upd" data-entity="${esc(r.update)}"><i></i>Mise à jour</span>` : "",
    ].join("") : "";

    // appareils connectés (attribut devices) : par type de connexion
    const devices = Array.isArray(st(r.clients)?.attributes?.devices) ? st(r.clients).attributes.devices : [];
    const count = (re) => devices.filter((d) => re.test(String(d?.connection_type || ""))).length;

    let body = "";
    if (!m.devId) {
      body = `<div class="empty">Aucun routeur ASUS trouvé<span>Installez l'intégration AsusRouter (HACS, dépôt Vaskivskyi/ha-asusrouter), ajoutez-la dans Paramètres › Appareils et services, puis rechargez la page.</span></div>`;
    } else {
      // --- système
      let system = "";
      if (c.show_system !== false) {
        const boot = this._txt(r.boot) || (this._num(r.uptime) !== null ? new Date(Date.now() - this._num(r.uptime) * 1000).toISOString() : null);
        const loads = [r.load1, r.load5, r.load15].map((id) => this._num(id));
        const latest = upd?.attributes?.latest_version;
        // « 3.0.0.4.386.14_2 » → « 386.14_2 », comme dans l'interface ASUS (version complète au survol)
        const fw = (v) => (v ? String(v).replace(/^3\.0\.0\.\d+\./, "") : v);
        const tiles = [
          boot && since(boot) ? `<div class="tile srv-t" data-entity="${esc(r.boot || r.uptime)}"><div class="tile-l"><ha-icon icon="mdi:clock-start"></ha-icon>Uptime</div><div class="nas-up">${esc(since(boot))}</div></div>` : "",
          upd || version ? `<div class="tile srv-t nas-dsm ${needUpd ? "up" : ""}" data-entity="${esc(r.update || "")}" title="${esc(version || "")}"><div class="tile-l"><ha-icon icon="${esc(needUpd ? "mdi:package-up" : "mdi:package-check")}"></ha-icon>Firmware</div>
            ${kv([["Version", fw(version)], needUpd ? ["Nouvelle", fw(latest) || "Oui", "bad"] : upd ? ["État", "À jour", "ok"] : [null, null]])}</div>` : "",
          loads.some((v) => v !== null) ? `<div class="tile srv-t" data-entity="${esc(r.load1 || r.load5)}"><div class="tile-l"><ha-icon icon="mdi:chart-line-variant"></ha-icon>Charge</div>
            <div class="omv-load">${loads.map((v, i) => `<span><b>${v === null ? "—" : fmt(v, 2)}</b><small>${[1, 5, 15][i]} min</small></span>`).join("")}</div></div>` : "",
        ].filter(Boolean);
        const cpuA = st(r.cpu)?.attributes || {};
        const cores = Object.keys(cpuA).filter((k) => /^core_\d+$/.test(k)).sort((a, b) => a.localeCompare(b, "fr", { numeric: true })).map((k) => `${fmt(cpuA[k], 0)} %`);
        const ramA = st(r.ram)?.attributes || {};
        const mo = (kb) => (Number.isFinite(Number(kb)) ? `${fmt(Number(kb) / 1024, 0)} Mo` : null);
        const temps = [["t_cpu", "Temp."], ["t_24", "2,4 GHz"], ["t_5", "5 GHz"], ["t_52", "5 GHz (2)"], ["t_6", "6 GHz"]]
          .map(([k, label]) => (this._num(r[k]) === null ? "" : gauge(r[k], "mdi:thermometer", label, this._num(r[k]), "", c.temp_warn, c.temp_alert, ` ${esc(this._unit(r[k], "°C"))}`, 110)));
        const res = [
          gauge(r.cpu, "mdi:cpu-32-bit", "CPU", this._num(r.cpu), cores.length > 1 ? `Cœurs ${cores.map((x) => x.replace(" %", "")).join(" · ")} %` : "", 70, 90),
          gauge(r.ram, "mdi:memory", "RAM", this._num(r.ram), mo(ramA.used) && mo(ramA.total) ? `${mo(ramA.used)} / ${mo(ramA.total)}` : "", 80, 92),
          ...temps,
        ].filter(Boolean);
        system = sec("mdi:information-outline", "Système", `${tiles.length ? `<div class="tiles srv-tiles">${tiles.join("")}</div>` : ""}${res.length ? `<div class="srv-grid pve-res">${res.join("")}</div>` : ""}`);
      }

      // --- Internet
      let net = "";
      if (c.show_internet !== false) {
        const wanMax = Number(c.wan_max) || 1000;
        const ip = this._txt(r.wan_ip) || internet?.attributes?.ip_address || null;
        const totals = [go(this._num(r.wan_rx_total)), go(this._num(r.wan_tx_total))];
        const rates = [
          rate(r.wan_rx, "mdi:download", "Download", wanMax, totals[0] ? `${totals[0]} depuis le démarrage` : "", "srv-in"),
          rate(r.wan_tx, "mdi:upload", "Upload", wanMax, totals[1] ? `${totals[1]} depuis le démarrage` : "", "srv-out"),
        ].filter(Boolean);
        const info = kv([["Connexion", online === null ? null : online ? "En ligne" : "Coupée", online ? "ok" : "bad"], ["IP publique", ip]]);
        net = sec("mdi:web", "Internet", `${info ? `<div class="asus-kv" data-entity="${esc(r.internet || r.wan_ip || "")}">${info}</div>` : ""}${rates.length ? `<div class="srv-grid">${rates.join("")}</div>` : ""}`);
      }

      // --- Wi-Fi : bandes, réseaux invités, débits par bande et filaire
      let wifi = "";
      if (c.show_wifi !== false) {
        const wMax = Number(c.wifi_max) || 300;
        const bands = [["wifi24", "2,4 GHz", /^2ghz$/], ["wifi5", "5 GHz", /^5ghz$/], ["wifi52", "5 GHz (2)", /^5ghz2$/], ["wifi6", "6 GHz", /^6ghz$/]]
          .filter(([k]) => st(r[k]))
          .map(([k, label, re]) => {
            const s = st(r[k]);
            const n = count(re);
            // seul le SSID est lu : les autres attributs du Wi-Fi (dont le mot de passe) ne sont jamais affichés
            const ssid = s.attributes?.ssid;
            return chip(r[k], `${label}${n ? ` · ${n}` : ""}`, s.state === "on", `${ssid ? `${ssid} · ` : ""}${s.state === "on" ? "Activé" : "Désactivé"}${n ? ` · ${n} appareil${n > 1 ? "s" : ""}` : ""}`);
          });
        const guestOn = m.guests.filter((id) => st(id)?.state === "on");
        const guestName = (id) => {
          const g = /_guest_(2_4|5|6)_ghz(?:_\d)?_(\d)$/.exec(id);
          return g ? `Invités ${g[1].replace("_", ",")} GHz n°${g[2]}` : "Invités";
        };
        const guests = guestOn.map((id) => chip(id, guestName(id), true));
        // débits par bande : une ligne par bande, barres réception et envoi
        const mbit = (id) => { const v = this._num(id); return v === null ? null : v; };
        const bar = (id, cls) => { const v = mbit(id); return v === null ? "<span></span>" : `<span class="asus-r ${cls}" data-entity="${esc(id)}"><b>${fmt(v, v < 10 ? 2 : v < 100 ? 1 : 0)}</b><small>${esc(this._unit(id, "Mbit/s"))}</small><i style="--w:${Math.max(0, Math.min(100, (v / wMax) * 100))}%"></i></span>`; };
        const rows = [["2,4 GHz", r.w24_rx, r.w24_tx], ["5 GHz", r.w5_rx, r.w5_tx], ["Filaire", r.lan_rx, r.lan_tx]]
          .filter(([, rx, tx]) => mbit(rx) !== null || mbit(tx) !== null)
          .map(([label, rx, tx]) => `<div class="asus-row"><span class="asus-rl">${label}</span>${bar(rx, "in")}${bar(tx, "out")}</div>`);
        // repliés par défaut : le bouton « Débits par bande » les déplie
        const ratesOpen = this._fold === "rates";
        const ratesBtn = rows.length ? `<button class="asus-more ${ratesOpen ? "on" : ""}" data-fold="rates"><ha-icon icon="${esc(ratesOpen ? "mdi:chevron-up" : "mdi:chevron-down")}"></ha-icon>${ratesOpen ? "Réduire" : "Débits par bande"}</button>` : "";
        const rates = rows.length && ratesOpen ? [`<div class="asus-rates"><div class="asus-row asus-rh"><span></span><span><ha-icon icon="mdi:download"></ha-icon>Réception</span><span><ha-icon icon="mdi:upload"></ha-icon>Envoi</span></div>${rows.join("")}</div>`] : [];
        const guestTxt = m.guests.length ? `<div class="asus-note">${guestOn.length ? "" : "Aucun réseau invité actif"}</div>` : "";
        wifi = sec("mdi:wifi", "Wi-Fi", bands.length || ratesBtn
          ? `${bands.length || guests.length ? `<div class="omv-svcs">${bands.join("")}${guests.join("")}</div>` : ""}${guestOn.length ? "" : guestTxt}${rates.join("")}${ratesBtn}`
          : "");
      }

      // --- ports Ethernet
      let ports = "";
      if (c.show_ports !== false) {
        const list = (id) => {
          const l = st(id)?.attributes?.list;
          return l && typeof l === "object" ? Object.entries(l).sort(([a], [b]) => Number(a) - Number(b)) : [];
        };
        const speed = (v) => (v >= 1000 ? `${fmt(v / 1000, v % 1000 ? 1 : 0)} G` : v > 0 ? `${v} M` : "—");
        const port = (id, label, p) => {
          const up = !!p?.state;
          const sp = Number(p?.link_rate) || 0;
          const cls = !up ? "off" : sp >= 1000 ? "g" : "m";
          return `<div class="asus-port ${cls}" data-entity="${esc(id)}" title="${esc(`${label} : ${up ? `connecté, ${speed(sp)}bit/s` : "déconnecté"}`)}"><ha-icon icon="mdi:ethernet"></ha-icon><b>${esc(label)}</b><small>${up ? speed(sp) : "—"}</small></div>`;
        };
        const wan = list(r.ports_wan).map(([, p]) => port(r.ports_wan, "WAN", p).replace('class="asus-port ', 'class="asus-port wan '));
        const lan = list(r.ports_lan).map(([n, p]) => port(r.ports_lan, `LAN ${n}`, p));
        const upCount = list(r.ports_lan).filter(([, p]) => p?.state).length;
        ports = sec("mdi:ethernet", `Ports <small class="pve-n">${lan.length ? `${upCount}/${lan.length} LAN connectés` : ""}</small>`, wan.length || lan.length ? `<div class="asus-ports">${wan.join("")}${lan.join("")}</div>` : "");
      }

      // --- appareils connectés
      let clients = "";
      if (c.show_clients !== false && (st(r.clients) || st(r.latest))) {
        const total = this._num(r.clients);
        const guestsN = this._num(r.guests);
        const tiles = [
          ["Wi-Fi 2,4 GHz", count(/^2ghz$/), "mdi:wifi", "2ghz"],
          ["Wi-Fi 5 GHz", count(/^5ghz/), "mdi:wifi", "5ghz"],
          ["Filaire", count(/^wired$/), "mdi:ethernet", "wired"],
          ["Invités", guestsN, "mdi:account-multiple-outline", "guest"],
        ].filter(([, v], i) => v !== null && (v > 0 || i < 3) && (devices.length || i === 3));
        const latestList = Array.isArray(st(r.latest)?.attributes?.list) ? [...st(r.latest).attributes.list] : [];
        latestList.sort((a, b) => String(b?.connected || "").localeCompare(String(a?.connected || "")));
        const n = Math.max(0, Math.min(20, Number(c.latest) || 0));
        const latest = latestList.slice(0, n).map((d) => {
          const name = String(d?.name || d?.ip || d?.mac || "Appareil").replace(/^\[\d+\]\s*/, "");
          const when = d?.connected ? since(d.connected) : null;
          return `<div class="asus-dev" data-entity="${esc(r.latest)}"><ha-icon icon="${esc(/wired/.test(d?.connection_type || "") ? "mdi:ethernet" : "mdi:wifi")}"></ha-icon><span>${esc(name)}</span><small>${esc([ASUS_LINK[d?.connection_type] || null, when ? `il y a ${when}` : null].filter(Boolean).join(" · "))}</small></div>`;
        });
        // liste complète, dépliée par « Voir tous » ou par une tuile : par type de connexion, puis par nom
        const open = this._devs && (devices.length || latest.length) ? this._devs : null;
        const ORDER = { "2ghz": 1, "5ghz": 2, "5ghz2": 3, "6ghz": 4, wired: 5 };
        const label = (d) => String(d?.name || d?.ip || d?.mac || "Appareil").replace(/^\[\d+\]\s*/, "");
        const shown = !open ? [] : devices
          .filter((d) => open === "all" || (open === "guest" ? d?.guest : String(d?.connection_type || "").startsWith(open)))
          .sort((a, b) => (ORDER[a?.connection_type] || 9) - (ORDER[b?.connection_type] || 9) || label(a).localeCompare(label(b), "fr", { numeric: true }));
        const full = shown.map((d) => {
          const when = d?.connected ? since(d.connected) : null;
          return `<div class="asus-dev"><ha-icon icon="${esc(/wired/.test(d?.connection_type || "") ? "mdi:ethernet" : "mdi:wifi")}"></ha-icon><div class="asus-dn"><span>${esc(label(d))}</span><small>${esc([d?.ip || null, ASUS_LINK[d?.connection_type] || null, when ? `depuis ${when}` : null].filter(Boolean).join(" · "))}</small></div></div>`;
        });
        const openName = { all: "Tous les appareils", "2ghz": "Wi-Fi 2,4 GHz", "5ghz": "Wi-Fi 5 GHz", wired: "Filaire", guest: "Invités" }[open];
        // tout est replié par défaut : le bouton déplie les dernières connexions et la liste complète
        const more = devices.length || latest.length
          ? `<button class="asus-more ${open ? "on" : ""}" data-devs="${open || "all"}"><ha-icon icon="${esc(open ? "mdi:chevron-up" : "mdi:chevron-down")}"></ha-icon>${open ? "Réduire" : devices.length ? `Voir les ${fmt(devices.length, 0)} appareils` : "Voir les dernières connexions"}</button>`
          : "";
        clients = sec("mdi:devices", `Appareils connectés <small class="pve-n">${total !== null ? fmt(total, 0) : ""}</small>`,
          `${tiles.length ? `<div class="asus-counts">${tiles.map(([lbl, v, icon, key]) => `<div class="${open === key ? "on" : ""}" ${devices.length && v ? `data-devs="${key}" title="Voir les appareils : ${lbl}"` : ""}><ha-icon icon="${esc(icon)}"></ha-icon><b>${v === null ? "—" : fmt(v, 0)}</b><small>${lbl}</small></div>`).join("")}</div>` : ""}
          ${open === "all" && latest.length ? `<div class="asus-sub">Dernières connexions</div><div class="asus-devs">${latest.join("")}</div>` : ""}
          ${open ? `<div class="asus-sub">${openName} <b>${fmt(shown.length, 0)}</b></div><div class="asus-devs asus-all">${full.join("") || `<div class="asus-note">Aucun appareil</div>`}</div>` : ""}
          ${more}`);
      }

      // --- VPN, contrôle parental
      let vpn = "";
      if (c.show_vpn !== false && (m.vpns.length || st(r.parental))) {
        const on = m.vpns.filter((id) => st(id)?.state === "on");
        const name = (id) => {
          const v = /_(openvpn|wireguard)_(client|server)_(\d)$/.exec(id);
          return v ? `${v[1] === "openvpn" ? "OpenVPN" : "WireGuard"} ${v[2] === "client" ? "client" : "serveur"} ${v[3]}` : id;
        };
        const chips = [...on.map((id) => chip(id, name(id), true)), st(r.parental) ? chip(r.parental, "Contrôle parental", st(r.parental).state === "on") : ""].filter(Boolean);
        vpn = sec("mdi:vpn", `VPN <small class="pve-n">${m.vpns.length ? `${on.length} actif${on.length > 1 ? "s" : ""}` : ""}</small>`,
          `${chips.length ? `<div class="omv-svcs">${chips.join("")}</div>` : ""}${m.vpns.length && !on.length ? `<div class="asus-note">Aucun VPN actif</div>` : ""}`);
      }

      // --- actions
      const acts = c.show_actions !== false ? [
        btn(r.reboot, "mdi:restart", "Redémarrer", "stop"),
        btn(r.restart_wifi, "mdi:wifi-refresh", "Redémarrer le Wi-Fi"),
        btn(r.refresh, "mdi:refresh", "Actualiser les appareils"),
        r.led ? btn(r.led, st(r.led)?.state === "on" ? "mdi:led-on" : "mdi:led-off", st(r.led)?.state === "on" ? "Éteindre les LED" : "Allumer les LED") : "",
      ].filter(Boolean) : [];

      body = system + net + wifi + ports + clients + vpn
        + sec("mdi:gesture-tap-button", "Actions", acts.length ? `<div class="pve-na asus-acts">${acts.join("")}</div>` : "");
    }

    const alertCls = m.devId && online === false ? "srv-alert" : "";
    const model = dev.model || dev.name || "Routeur ASUS";
    // le routeur répond (ses capteurs sont là) même quand Internet est coupé : le voyant Internet le signale
    const sub = [this._txt(r.cpu) === null && m.devId ? "Injoignable" : null, version ? `Firmware ${version}` : null].filter(Boolean).join(" · ");
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${NAS_STYLE}${PVE_STYLE}${OMV_STYLE}${ASUS_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${alertCls}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:router-wireless")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
          <div><div class="title">${esc(c.title || dev.name_by_user || model)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}${routerIp ? `<div class="sub">${esc(routerIp)}</div>` : ""}</div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const ASUS_STYLE = `<style>
.asus-kv { padding: 8px 12px; border-radius: 12px; border: 1px solid var(--med-line); margin-bottom: 8px; cursor: pointer; }
.asus-note { font-size: .75rem; color: var(--med-muted); margin-top: 6px; }
.asus-rates { margin-top: 10px; display: grid; gap: 6px; }
.asus-row { display: grid; grid-template-columns: 62px 1fr 1fr; gap: 10px; align-items: center; font-size: .8rem; }
.asus-rh { font-size: .7rem; color: var(--med-muted); } .asus-rh span { display: inline-flex; align-items: center; gap: 4px; } .asus-rh ha-icon { --mdc-icon-size: 14px; }
.asus-rl { color: var(--med-muted); white-space: nowrap; }
.asus-r { position: relative; display: flex; align-items: baseline; gap: 4px; padding-bottom: 6px; cursor: pointer; }
.asus-r small { font-size: .66rem; color: var(--med-muted); }
.asus-r::before, .asus-r i { content: ""; position: absolute; left: 0; bottom: 0; height: 4px; border-radius: 4px; }
.asus-r::before { right: 0; background: var(--med-line); }
.asus-r i { width: var(--w); background: var(--med-accent, var(--med-blue)); }
.asus-r.out i { background: var(--med-green); }
/* 4 ports par ligne (8 ports LAN : 2 lignes de 4, 16 ports : 4 lignes) ; le port WAN seul sur la première ligne */
.asus-ports { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.asus-port.wan + .asus-port { grid-column-start: 1; }
.asus-port { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 6px 4px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--med-line); background: var(--med-surface); color: var(--med-muted); }
.asus-port ha-icon { --mdc-icon-size: 18px; }
.asus-port b { font-size: .72rem; color: var(--med-text); white-space: nowrap; }
.asus-port small { font-size: .66rem; }
.asus-port.g { border-color: color-mix(in srgb, var(--med-down) 55%, transparent); } .asus-port.g ha-icon, .asus-port.g small { color: var(--med-down); }
.asus-port.m { border-color: color-mix(in srgb, #f0a33a 55%, transparent); } .asus-port.m ha-icon, .asus-port.m small { color: #f0a33a; }
.asus-port.off { opacity: .55; }
.asus-counts { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 6px; }
.asus-counts > [data-devs] { cursor: pointer; } .asus-counts > [data-devs]:hover { border-color: var(--med-accent, var(--med-blue)); }
.asus-counts > .on { border-color: var(--med-accent, var(--med-blue)); }
.asus-more { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 8px;
  padding: 7px; border-radius: 10px; border: 1px solid var(--med-line); font-size: .78rem; font-weight: 600; color: var(--med-muted); }
.asus-more:hover, .asus-more.on { color: var(--med-text); border-color: var(--med-accent, var(--med-blue)); }
.asus-more ha-icon { --mdc-icon-size: 18px; }
.asus-sub b { color: var(--med-text); margin-left: 4px; }
.asus-all { max-height: 420px; overflow-y: auto; }
.asus-all .asus-dev { cursor: default; grid-template-columns: 20px 1fr; }
.asus-dn { display: grid; min-width: 0; } .asus-dn small { white-space: normal; }
.asus-counts > div { display: grid; justify-items: center; padding: 8px 4px; border-radius: 10px; border: 1px solid var(--med-line); background: var(--med-surface); }
.asus-counts ha-icon { --mdc-icon-size: 18px; color: var(--med-accent, var(--med-blue)); }
.asus-counts b { font-size: 1.15rem; } .asus-counts small { font-size: .68rem; color: var(--med-muted); text-align: center; }
.asus-sub { font-size: .75rem; color: var(--med-muted); margin: 10px 0 4px; }
.asus-devs { display: grid; gap: 2px; }
.asus-dev { display: grid; grid-template-columns: 20px 1fr auto; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 8px; cursor: pointer; font-size: .8rem; }
.asus-dev:hover { background: var(--med-surface); }
.asus-dev ha-icon { --mdc-icon-size: 16px; color: var(--med-muted); }
.asus-dev span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.asus-dev small { font-size: .7rem; color: var(--med-muted); white-space: nowrap; }
.asus-acts .pve-btn span { font-size: .74rem; }
</style>`;

/* ------------------------------------------------------------ carte Réseau (Ping) */

const PING_DEFAULTS = {
  title: "Réseau",
  icon: "mdi:lan",
  icon_color: "",
  group_by: "auto", // auto : par type d'appareil ; area : par pièce ; none : une seule liste
  expanded: false, // groupes dépliés à l'ouverture
  warn_ms: 20, alert_ms: 100, // latence moyenne : orange, rouge
  exclude: [], // noms ou entités à ignorer
  standby: [], // appareils éteints volontairement (entités, noms ou adresses IP) : gris « Éteint » au lieu de rouge
  standby_groups: [], // groupes entiers éteints volontairement (print, mobile, media…)
  theme: "v2",
};

/** Capteurs d'un appareil Ping : clé de traduction, sinon fin de l'identifiant (français ou anglais). */
const PING_ROLES = [
  ["avg", /round_trip_time_av/, /_(round_trip_time_average|round_trip_time_avg|temps_d_aller_retour_moyen)$/],
  ["max", /round_trip_time_max/, /_(round_trip_time_maximum|round_trip_time_max|temps_d_aller_retour_maximum)$/],
  ["min", /round_trip_time_min/, /_(round_trip_time_minimum|round_trip_time_min|temps_d_aller_retour_minimum)$/],
  ["jitter", /jitter|mdev/, /_(jitter|gigue|round_trip_time_mean_deviation|ecart_moyen_du_temps_d_aller_retour)$/],
  ["loss", /loss/, /_(packet_loss|perte_de_paquets)$/],
];

/** Types d'appareils, d'après leur nom (ordre d'affichage). */
const PING_GROUPS = [
  ["net", "Réseau", "mdi:router-network", /rout|point d'acc|access point|switch|unbound|adguard|pi-?hole|dns|wireguard|vpn|nginx|proxy manager|traefik|opnsense|pfsense|box/i],
  ["srv", "Serveurs", "mdi:server", /proxmox|pimox|pve|home assistant|haos|nas|synology|diskstation|openmediavault|omv|unraid|truenas|docker|mqtt|esphome|zigbee2mqtt|z2m|go2rtc|frigate|grafana|influx|victoria|mariadb|postgres|plex|jellyfin|emby|tautulli|transmission|qbittorrent|sonarr|radarr|fireshare|peanut|spoolman|myelectricaldata|nextcloud|vaultwarden|serveur|server/i],
  ["print", "Imprimantes", "mdi:printer-3d", /imprimante|printer|ender|znp|k1\b|bambu|prusa|voron|klipper|moonraker|octoprint/i],
  ["media", "Multimédia", "mdi:television", /tv\b|télé|tele|chromecast|nest hub|fire ?tv|shield|apple tv|sonos|enceinte|echo|google home|kodi/i],
  ["mobile", "Téléphones et ordinateurs", "mdi:cellphone-link", /phone|téléphone|telephone|pad\b|tablette|tablet|ipad|pc\b|portable|laptop|ordinateur|macbook|poco|redmi|realme|pixel|galaxy|iphone|n73/i],
  ["home", "Domotique", "mdi:home-automation", /prise|plug|bt proxy|bluetooth|passerelle|gateway|awtrix|aspirateur|vacuum|robot|caméra|camera|cam\b|shelly|sonoff|tasmota|esp|capteur|sensor|lampe|light|ampoule/i],
];

const PING_MATCH = ["print", "mobile", "net", "srv", "media", "home"];

class ServeurHaPingCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-ping-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...PING_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    this._open = new Set(this._config.expanded ? ["*"] : []);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const fold = ev.target.closest?.("[data-fold]");
        if (fold) {
          // groupe : déplier ou replier
          ev.stopPropagation();
          const k = fold.dataset.fold;
          if (this._open.has("*")) { this._open = new Set(this._groupKeys || []); this._open.delete(k); }
          else if (this._open.has(k)) this._open.delete(k);
          else this._open.add(k);
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
    if (this._hass?.entities !== hass.entities || this._hass?.devices !== hass.devices || this._hass?.areas !== hass.areas) this._map = null;
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
    return 6;
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

  /** Appareils suivis par l'intégration Ping : capteur de connexion, latences, gigue, perte de paquets, groupe. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass, c = this._config;
    const reg = hass.entities || {}, devs = hass.devices || {}, areas = hass.areas || {};
    const ex = (Array.isArray(c.exclude) ? c.exclude : String(c.exclude || "").split(",")).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
    const byDev = {};
    for (const [id, e] of Object.entries(reg)) {
      if (e.platform !== "ping" || !hass.states[id] || e.hidden) continue;
      const key = e.device_id || id;
      const d = (byDev[key] ||= { key, dev: devs[e.device_id], roles: {}, area: e.area_id || devs[e.device_id]?.area_id || null });
      const domain = id.split(".")[0];
      if (domain === "binary_sensor") d.roles.up ||= id;
      else if (domain === "device_tracker") d.roles.tracker ||= id;
      else if (domain === "sensor") {
        const role = PING_ROLES.find(([, tk, re]) => (e.translation_key && tk.test(e.translation_key)) || re.test(id));
        if (role && !d.roles[role[0]]) d.roles[role[0]] = id;
      }
    }
    const hosts = Object.values(byDev).filter((d) => d.roles.up || d.roles.tracker).map((d) => {
      const up = this._st(d.roles.up);
      const name = d.dev?.name_by_user || d.dev?.name || up?.attributes?.friendly_name || d.roles.up;
      const ip = this._st(d.roles.tracker)?.attributes?.ip || (/(\d+_\d+_\d+_\d+)/.exec(d.roles.up || "") || [, ""])[1].replace(/_/g, ".") || null;
      return { ...d, name, ip };
    }).filter((h) => !ex.some((x) => h.name.toLowerCase() === x || Object.values(h.roles).includes(x) || h.ip === x));
    const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
    const sb = list(c.standby), sbGroups = list(c.standby_groups);
    // groupes : par pièce, par type d'appareil (nom), ou un seul
    const groupOf = (h) => {
      if (c.group_by === "none") return ["all", "Appareils", "mdi:lan"];
      if (c.group_by === "area") {
        const a = areas[h.area];
        return a ? [`area:${h.area}`, a.name, a.icon || "mdi:texture-box"] : ["noarea", "Sans pièce", "mdi:help-circle-outline"];
      }
      // téléphones testés avant le multimédia : « Téléphone » contient « Télé »
      const g = PING_MATCH.map((k) => PING_GROUPS.find((x) => x[0] === k)).find(([, , , re]) => re.test(h.name));
      return g ? g.slice(0, 3) : ["other", "Autres", "mdi:devices"];
    };
    const groups = new Map();
    for (const h of hosts) {
      const [k, label, icon] = groupOf(h);
      // éteint volontairement : appareil listé, ou son groupe
      h.standby = sbGroups.includes(k) || sb.some((x) => h.name.toLowerCase() === x || Object.values(h.roles).includes(x) || h.ip === x);
      if (!groups.has(k)) groups.set(k, { key: k, label, icon, hosts: [] });
      groups.get(k).hosts.push(h);
    }
    const order = PING_GROUPS.map((g) => g[0]);
    const sorted = [...groups.values()].sort((a, b) => {
      const ia = order.indexOf(a.key), ib = order.indexOf(b.key);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.label.localeCompare(b.label, "fr");
    });
    const ipNum = (ip) => (ip || "").split(".").reduce((n, x) => n * 256 + (Number(x) || 0), 0);
    for (const g of sorted) g.hosts.sort((a, b) => ipNum(a.ip) - ipNum(b.ip) || a.name.localeCompare(b.name, "fr", { numeric: true }));
    this._map = { hosts, groups: sorted };
    return this._map;
  }

  /** En ligne : capteur de connexion (on), sinon suivi d'appareil (home). null si inconnu. */
  _isUp(h) {
    const s = this._st(h.roles.up) || this._st(h.roles.tracker);
    if (!s || s.state === "unavailable" || s.state === "unknown") return null;
    return s.state === "on" || s.state === "home";
  }

  /** État affiché : up, down (hors ligne), off (éteint volontairement), na (inconnu). */
  _state(h) {
    const u = this._isUp(h);
    return u === true ? "up" : u === false ? (h.standby ? "off" : "down") : "na";
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    this._groupKeys = m.groups.map((g) => g.key);
    const ids = m.hosts.flatMap((h) => [h.roles.up, h.roles.avg, h.roles.loss]);
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${[...this._open].join(",")}|${Math.floor(Date.now() / 60000)}|` + ids.map((id) => this._st(id)?.state ?? "-").join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const warn = Number(c.warn_ms) || 20, alert = Number(c.alert_ms) || 100;
    const ms = (v) => (v === null ? "—" : `${fmt(v, v < 10 ? 1 : 0)} ms`);
    const lat = (v) => (v === null ? "" : v >= alert ? "bad" : v >= warn ? "warn" : "ok");
    const downSince = (h) => { const s = this._st(h.roles.up); return s?.last_changed ? since(s.last_changed) : null; };
    const open = (k) => this._open.has("*") || this._open.has(k);

    const hosts = m.hosts;
    const down = hosts.filter((h) => this._state(h) === "down");
    const offN = hosts.filter((h) => this._state(h) === "off").length;
    const upN = hosts.filter((h) => this._isUp(h) === true).length;
    const lossy = hosts.filter((h) => this._isUp(h) && (this._num(h.roles.loss) || 0) > 0);
    const avgs = hosts.map((h) => (this._isUp(h) ? this._num(h.roles.avg) : null)).filter((v) => v !== null);
    const mean = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;

    const tile = (h) => {
      const up = this._isUp(h);
      const off = this._state(h) === "off";
      const avg = up ? this._num(h.roles.avg) : null;
      const loss = up ? this._num(h.roles.loss) : null;
      const jit = up ? this._num(h.roles.jitter) : null;
      const cls = off ? "off" : up === false ? "down" : up === null ? "na" : loss > 0 ? "warn" : lat(avg);
      const detail = off ? "Éteint" : up === false ? (downSince(h) ? `depuis ${downSince(h)}` : "hors ligne")
        : [avg !== null ? ms(avg) : null, loss > 0 ? `${fmt(loss, 0)} % perdus` : null].filter(Boolean).join(" · ");
      const title = [h.name, h.ip, off ? "Éteint (volontairement)" : up === false ? "Hors ligne" : up ? "En ligne" : "Inconnu",
        avg !== null ? `Moyenne ${ms(avg)}` : null, this._num(h.roles.max) !== null && up ? `Max ${ms(this._num(h.roles.max))}` : null,
        jit !== null ? `Gigue ${ms(jit)}` : null, loss !== null ? `Perte ${fmt(loss, 0)} %` : null].filter(Boolean).join(" · ");
      return `<div class="ping-h s-${cls || "ok"}" data-entity="${esc(h.roles.up || h.roles.tracker)}" title="${esc(title)}"><i></i><div class="ping-n"><span>${esc(h.name)}</span><small>${esc(detail || h.ip || "")}</small></div></div>`;
    };

    // --- hors ligne, toujours visibles en haut
    const downHtml = down.length ? `<div class="srv-sec"><div class="srv-h ping-bad"><ha-icon icon="mdi:lan-disconnect"></ha-icon>Hors ligne <small class="pve-n">${down.length}</small></div><div class="ping-grid">${down.map(tile).join("")}</div></div>` : "";

    // --- groupes, repliés par défaut : un point par appareil, la liste au clic
    const groupsHtml = m.groups.map((g) => {
      const n = g.hosts.length, ok = g.hosts.filter((h) => this._isUp(h) === true).length, bad = g.hosts.filter((h) => this._state(h) === "down").length;
      const isOpen = open(g.key);
      const dots = g.hosts.map((h) => { const st = this._state(h); return `<i class="${st === "up" ? "ok" : st}"></i>`; }).join("");
      return `<div class="ping-g ${isOpen ? "open" : ""}">
        <button class="ping-gh" data-fold="${esc(g.key)}" aria-expanded="${isOpen}"><ha-icon icon="${esc(g.icon)}"></ha-icon><span class="ping-gl">${esc(g.label)}</span>
          <span class="ping-dots">${dots}</span><b class="${bad ? "bad" : "ok"}">${ok}/${n}</b><ha-icon class="ping-chev" icon="${esc(isOpen ? "mdi:chevron-up" : "mdi:chevron-down")}"></ha-icon></button>
        ${isOpen ? `<div class="ping-grid">${g.hosts.map(tile).join("")}</div>` : ""}
      </div>`;
    }).join("");

    const body = !hosts.length
      ? `<div class="empty">Aucun appareil suivi par Ping<span>Ajoutez l'intégration Ping (ICMP) pour chaque appareil dans Paramètres › Appareils et services, puis rechargez la page.</span></div>`
      : `<div class="ping-sum">
          <div class="${down.length ? "bad" : "ok"}"><b>${upN}<small>/${hosts.length}</small></b><span>en ligne</span></div>
          <div class="${down.length ? "bad" : ""}"><b>${down.length}</b><span>hors ligne${offN ? ` · ${offN} éteint${offN > 1 ? "s" : ""}` : ""}</span></div>
          <div class="${lat(mean)}"><b>${mean === null ? "—" : fmt(mean, mean < 10 ? 1 : 0)}<small> ms</small></b><span>latence moyenne</span></div>
          <div class="${lossy.length ? "warn" : ""}"><b>${lossy.length}</b><span>perte de paquets</span></div>
        </div>${downHtml}<div class="srv-sec ping-groups">${groupsHtml}</div>`;

    const leds = hosts.length ? (down.length
      ? `<span class="srv-led bad"><i></i>${down.length} hors ligne</span>`
      : `<span class="srv-led ok"><i></i>Tout en ligne</span>`) : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${PVE_STYLE}${PING_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${down.length ? "srv-alert" : ""}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:lan")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
          <div><div class="title">${esc(c.title || "Réseau")}</div><div class="sub">${hosts.length} appareil${hosts.length > 1 ? "s" : ""} suivi${hosts.length > 1 ? "s" : ""} par Ping</div></div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const PING_STYLE = `<style>
.ping-sum { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 4px 12px 0; }
@container (max-width: 420px) { .ping-sum { grid-template-columns: repeat(2, 1fr); } }
.ping-sum > div { display: grid; justify-items: center; padding: 8px 4px; border-radius: 12px; border: 1px solid var(--med-line); background: var(--med-surface); }
.ping-sum b { font-size: 1.2rem; } .ping-sum b small { font-size: .7rem; color: var(--med-muted); font-weight: 500; }
.ping-sum span { font-size: .68rem; color: var(--med-muted); text-align: center; }
.ping-sum .ok b { color: var(--med-down); } .ping-sum .warn b { color: #f0a33a; } .ping-sum .bad b { color: var(--t-red); }
.ping-sum .bad { border-color: color-mix(in srgb, var(--t-red) 55%, transparent); }
.ping-bad ha-icon { color: var(--t-red); }
.ping-groups { display: grid; gap: 6px; }
.ping-g { border: 1px solid var(--med-line); border-radius: 12px; overflow: hidden; }
.ping-gh { all: unset; box-sizing: border-box; cursor: pointer; width: 100%; display: flex; align-items: center; gap: 8px; padding: 9px 12px; font-size: .84rem; }
.ping-gh:hover { background: var(--med-surface); }
.ping-gh > ha-icon { --mdc-icon-size: 18px; color: var(--med-accent, var(--med-blue)); flex: none; }
.ping-gl { font-weight: 600; white-space: nowrap; }
.ping-dots { flex: 1; display: flex; flex-wrap: wrap; gap: 3px; justify-content: flex-end; min-width: 0; }
.ping-dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--med-down); }
.ping-dots i.down { background: var(--t-red); } .ping-dots i.na, .ping-dots i.off { background: var(--med-muted); }
.ping-dots i.off { opacity: .55; }
.ping-gh b { font-size: .8rem; white-space: nowrap; } .ping-gh b.ok { color: var(--med-down); } .ping-gh b.bad { color: var(--t-red); }
.ping-chev { --mdc-icon-size: 18px; color: var(--med-muted); flex: none; }
.ping-g.open .ping-grid { padding: 0 8px 8px; }
.ping-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
.ping-h { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 10px; cursor: pointer; border: 1px solid var(--med-line); background: var(--med-surface); min-width: 0; }
.ping-h > i { width: 9px; height: 9px; border-radius: 50%; flex: none; background: var(--med-down); }
.ping-h.s-warn > i { background: #f0a33a; } .ping-h.s-bad > i, .ping-h.s-down > i { background: var(--t-red); } .ping-h.s-na > i { background: var(--med-muted); }
.ping-h.s-down { border-color: color-mix(in srgb, var(--t-red) 55%, transparent); }
.ping-n { display: grid; min-width: 0; }
.ping-n span { font-size: .78rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ping-n small { font-size: .68rem; color: var(--med-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ping-h.s-down small { color: var(--t-red); white-space: normal; }
.ping-h.s-off { opacity: .6; } .ping-h.s-off > i { background: var(--med-muted); }
ha-card > .srv-sec:last-child { margin-bottom: 12px; }
</style>`;

/* ------------------------------------------------------------ carte Zigbee et piles */

const ZB_DEFAULTS = {
  title: "Zigbee et piles",
  icon: "mdi:zigbee",
  icon_color: "",
  source: "all", // all : tous les appareils à pile ; zigbee : appareils Zigbee seulement (Zigbee2MQTT, ZHA)
  include_phones: false, // téléphones et tablettes (Companion App) : leur batterie se recharge, ignorés par défaut
  warn: 30, alert: 15, // pile orange sous warn %, rouge sous alert %
  lqi_warn: 50, // qualité du lien Zigbee orange en dessous (0 à 255)
  silent_hours: 25, // appareil Zigbee « silencieux » sans nouvelle depuis ce nombre d'heures (capteur Last seen)
  exclude: [], // noms d'appareils ou entités à ignorer
  expanded: false, // liste « Tout va bien » dépliée à l'ouverture
  theme: "v2",
};

/** Appareil Zigbee : intégration ZHA, ou appareil MQTT créé par Zigbee2MQTT (identifiant zigbee2mqtt_…, ou relié au pont). */
const zbIsZigbee = (dev, devs, platforms) => {
  if (platforms.has("zha")) return true;
  if (!platforms.has("mqtt") || !dev) return false;
  if ((dev.identifiers || []).some((x) => /^zigbee2mqtt_/.test(String(x?.[1] ?? "")))) return true;
  const via = devs[dev.via_device_id];
  return !!via && /zigbee2mqtt|bridge|coordinat/i.test(`${via.name || ""} ${via.model || ""}`);
};

class ServeurHaZigbeeCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-zigbee-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...ZB_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    this._open = new Set(this._config.expanded ? ["bat", "mains"] : []);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const fold = ev.target.closest?.("[data-fold]");
        if (fold) {
          ev.stopPropagation();
          const k = fold.dataset.fold;
          if (this._open.has(k)) this._open.delete(k); else this._open.add(k);
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
    return 6;
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

  /** Appareils suivis : capteur de pile (%), pile faible (binaire), qualité du lien, dernière nouvelle, entités. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass, c = this._config;
    const reg = hass.entities || {}, devs = hass.devices || {}, areas = hass.areas || {};
    const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
    const ex = list(c.exclude);
    const byDev = {};
    for (const [id, st] of Object.entries(hass.states)) {
      const e = reg[id];
      if (e?.hidden) continue;
      const key = e?.device_id || id;
      const a = st.attributes || {};
      const domain = id.split(".")[0];
      const d = (byDev[key] ||= { key, dev: devs[e?.device_id], platforms: new Set(), ids: [], roles: {} });
      if (e?.platform) d.platforms.add(e.platform);
      if (e?.device_id) d.ids.push(id);
      if (domain === "sensor" && a.device_class === "battery" && a.unit_of_measurement === "%") d.roles.battery ||= id;
      else if (domain === "binary_sensor" && a.device_class === "battery") d.roles.low ||= id;
      else if (domain === "sensor" && (e?.translation_key === "linkquality" || /_linkquality$/.test(id))) d.roles.lqi ||= id;
      else if (domain === "sensor" && (e?.translation_key === "last_seen" || /_last_seen$/.test(id))) d.roles.seen ||= id;
    }
    const items = [];
    for (const d of Object.values(byDev)) {
      if (!d.dev) continue; // entité sans appareil : ignorée
      const zigbee = zbIsZigbee(d.dev, devs, d.platforms);
      const phone = d.platforms.has("mobile_app");
      if (c.source === "zigbee" ? !zigbee : !(zigbee || d.roles.battery || d.roles.low)) continue;
      if (phone && !c.include_phones) continue;
      const name = d.dev.name_by_user || d.dev.name || this._st(d.roles.battery)?.attributes?.friendly_name || d.key;
      if (ex.some((x) => name.toLowerCase() === x || d.ids.includes(x))) continue;
      const area = areas[d.dev.area_id]?.name || "";
      items.push({ ...d, name, area, zigbee, model: [d.dev.manufacturer, d.dev.model].filter(Boolean).join(" ") });
    }
    // pont Zigbee2MQTT : état de connexion
    const bridge = Object.keys(hass.states).find((id) => /^binary_sensor\..*zigbee2mqtt.*(bridge_)?connection_state$/.test(id)) || null;
    this._map = { items, bridge };
    return this._map;
  }

  /** État d'un appareil : off (hors ligne), alert, warn, lqi, silent, ok. */
  _state(it) {
    const c = this._config;
    const main = it.roles.battery || it.roles.low || it.ids[0];
    const known = it.ids.map((id) => this._st(id)).filter(Boolean);
    const offline = known.length > 0 && known.every((s) => s.state === "unavailable");
    const bat = this._num(it.roles.battery);
    const low = this._st(it.roles.low)?.state === "on";
    const lqi = this._num(it.roles.lqi);
    const seenS = this._st(it.roles.seen)?.state;
    const seenT = seenS ? new Date(seenS).getTime() : NaN;
    const silent = Number.isFinite(seenT) && Date.now() - seenT > (Number(c.silent_hours) || 25) * 3600e3;
    const alert = Number(c.alert) || 15, warn = Number(c.warn) || 30;
    const st = offline ? "off" : (bat !== null && bat < alert) || (bat === null && low) ? "alert" : bat !== null && bat < warn ? "warn"
      : silent ? "silent" : lqi !== null && lqi < (Number(c.lqi_warn) || 50) ? "lqi" : "ok";
    return { st, bat, low, lqi, seen: Number.isFinite(seenT) ? seenS : null, main, offSince: offline ? known[0].last_changed : null };
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    const ids = m.items.flatMap((it) => [it.roles.battery, it.roles.low, it.roles.lqi, it.ids[0]]);
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${[...this._open].join(",")}|${Math.floor(Date.now() / 60000)}|${this._st(m.bridge)?.state}|` + ids.map((id) => this._st(id)?.state ?? "-").join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const rows = m.items.map((it) => ({ it, s: this._state(it) }));
    const by = (k) => rows.filter((r) => r.s.st === k);
    const off = by("off"), alert = by("alert"), warn = by("warn"), weak = [...by("silent"), ...by("lqi")];
    const okRows = by("ok").sort((a, b) => (a.s.bat ?? 101) - (b.s.bat ?? 101) || a.it.name.localeCompare(b.it.name, "fr", { numeric: true }));
    const okBat = okRows.filter((r) => r.it.roles.battery || r.it.roles.low), okMains = okRows.filter((r) => !(r.it.roles.battery || r.it.roles.low));
    const bats = rows.filter((r) => r.s.bat !== null);
    const lowest = bats.length ? bats.reduce((a, b) => (b.s.bat < a.s.bat ? b : a)) : null;
    const zb = rows.filter((r) => r.it.zigbee).length;
    const nBat = rows.filter((r) => r.it.roles.battery || r.it.roles.low).length;

    const batCls = (v) => (v === null ? "" : v < (Number(c.alert) || 15) ? "bad" : v < (Number(c.warn) || 30) ? "warn" : "ok");
    const line = ({ it, s }) => {
      const detail = s.st === "off" ? `hors ligne${s.offSince && since(s.offSince) ? ` depuis ${since(s.offSince)}` : ""}`
        : s.st === "silent" ? `aucune nouvelle depuis ${since(s.seen)}`
        : [it.area || it.model, s.lqi !== null ? `signal ${fmt(s.lqi, 0)}` : null, s.seen && s.st !== "ok" ? `vu il y a ${since(s.seen)}` : null].filter(Boolean).join(" · ");
      const val = s.bat !== null ? `<b class="${batCls(s.bat)}">${fmt(s.bat, 0)} %</b>` : s.low ? `<b class="bad">Faible</b>` : it.roles.low ? `<b class="ok">OK</b>` : it.zigbee && !it.roles.battery ? `<small class="zb-mains">secteur</small>` : "";
      const gauge = s.bat !== null ? `<span class="zb-g ${batCls(s.bat)}"><i style="width:${Math.max(3, Math.min(100, s.bat))}%"></i></span>` : "";
      const title = [it.name, it.model, it.area, s.bat !== null ? `Pile ${fmt(s.bat, 0)} %` : null, s.lqi !== null ? `Qualité du lien ${fmt(s.lqi, 0)}/255` : null, s.seen ? `Dernière nouvelle il y a ${since(s.seen)}` : null].filter(Boolean).join(" · ");
      return `<div class="zb-r s-${s.st}" data-entity="${esc(s.main)}" title="${esc(title)}"><i class="zb-d"></i><div class="zb-n"><span>${esc(it.name)}</span><small>${esc(detail)}</small></div>${gauge}${val}</div>`;
    };
    // groupes repliés : piles en bon état, appareils sur secteur
    const fold = (k, icon, label, list) => {
      if (!list.length) return "";
      const on = this._open.has(k);
      return `<div class="ping-g ${on ? "open" : ""}"><button class="ping-gh" data-fold="${k}" aria-expanded="${on}"><ha-icon icon="${icon}"></ha-icon><span class="ping-gl">${label}</span>
        <span class="ping-dots"></span><b class="ok">${list.length}</b><ha-icon class="ping-chev" icon="${on ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon></button>
        ${on ? `<div class="zb-list zb-in">${list.map(line).join("")}</div>` : ""}</div>`;
    };
    const sec = (list, icon, label, cls) => (list.length ? `<div class="srv-sec"><div class="srv-h ${cls}"><ha-icon icon="${icon}"></ha-icon>${label} <small class="pve-n">${list.length}</small></div><div class="zb-list">${list.map(line).join("")}</div></div>` : "");

    const bridgeSt = this._st(m.bridge)?.state;
    const bridgeOk = bridgeSt === "on" ? true : bridgeSt === "off" ? false : null;
    const body = !rows.length
      ? `<div class="empty">Aucun appareil à pile ni appareil Zigbee trouvé<span>La carte lit les capteurs de batterie (en %) de vos appareils, et les appareils Zigbee2MQTT ou ZHA. Vérifiez que leurs capteurs de batterie sont activés.</span></div>`
      : `<div class="ping-sum">
          <div class="${off.length ? "bad" : "ok"}"><b>${rows.length - off.length}<small>/${rows.length}</small></b><span>en ligne${zb ? ` · ${zb} Zigbee` : ""}</span></div>
          <div class="${alert.length ? "bad" : warn.length ? "warn" : "ok"}"><b>${alert.length + warn.length}</b><span>pile${alert.length + warn.length > 1 ? "s" : ""} faible${alert.length + warn.length > 1 ? "s" : ""}</span></div>
          <div class="${batCls(lowest?.s.bat ?? null)}" ${lowest ? `data-entity="${esc(lowest.it.roles.battery)}"` : ""}><b>${lowest ? `${fmt(lowest.s.bat, 0)}<small> %</small>` : "—"}</b><span>${lowest ? `plus faible : ${esc(lowest.it.name)}` : "aucune pile"}</span></div>
          <div class="${weak.length ? "warn" : ""}"><b>${weak.length}</b><span>signal faible ou silencieux</span></div>
        </div>
        ${bridgeOk === false ? `<div class="zb-alert" data-entity="${esc(m.bridge)}"><ha-icon icon="mdi:zigbee"></ha-icon>Pont Zigbee2MQTT déconnecté : aucun appareil Zigbee ne répond.</div>` : ""}
        ${sec(off, "mdi:lan-disconnect", "Hors ligne", "ping-bad")}
        ${sec(alert, "mdi:battery-alert-variant-outline", "Piles à changer", "ping-bad")}
        ${sec(warn, "mdi:battery-low", "Piles faibles", "zb-warn")}
        ${sec(weak, "mdi:signal-cellular-1", "Signal faible ou silencieux", "zb-warn")}
        ${okBat.length || okMains.length ? `<div class="srv-sec ping-groups">${fold("bat", "mdi:battery-high", "Piles en bon état", okBat)}${fold("mains", "mdi:power-plug-outline", "Sur secteur", okMains)}</div>` : ""}`;

    const nbBad = off.length + alert.length;
    const leds = [
      bridgeOk !== null ? `<span class="srv-led ${bridgeOk ? "ok" : "bad"}" data-entity="${esc(m.bridge)}"><i></i>Pont ${bridgeOk ? "connecté" : "déconnecté"}</span>` : "",
      rows.length ? (nbBad ? `<span class="srv-led bad"><i></i>${nbBad} à traiter</span>` : warn.length + weak.length ? `<span class="srv-led upd"><i></i>${warn.length + weak.length} à surveiller</span>` : `<span class="srv-led ok"><i></i>Tout va bien</span>`) : "",
    ].join("");
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${PVE_STYLE}${PING_STYLE}${ZB_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${nbBad || bridgeOk === false ? "srv-alert" : ""}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:zigbee")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
          <div><div class="title">${esc(c.title || "Zigbee et piles")}</div><div class="sub">${rows.length} appareil${rows.length > 1 ? "s" : ""}${nBat ? `, ${nBat} à pile` : ""}</div></div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const ZB_STYLE = `<style>
.zb-list { display: grid; gap: 4px; }
.zb-in { padding: 0 8px 8px; }
.zb-r { display: flex; align-items: center; gap: 9px; padding: 7px 10px; min-height: 46px; box-sizing: border-box; border-radius: 10px; border: 1px solid var(--med-line); background: var(--med-surface); cursor: pointer; min-width: 0; }
.zb-d { width: 9px; height: 9px; border-radius: 50%; flex: none; background: var(--med-down); }
.zb-r.s-off .zb-d, .zb-r.s-alert .zb-d { background: var(--t-red); } .zb-r.s-warn .zb-d, .zb-r.s-lqi .zb-d, .zb-r.s-silent .zb-d { background: #f0a33a; }
.zb-r.s-off, .zb-r.s-alert { border-color: color-mix(in srgb, var(--t-red) 55%, transparent); }
.zb-n { flex: 1; display: grid; min-width: 0; }
.zb-n span { font-size: .8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.zb-n small { font-size: .68rem; color: var(--med-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.zb-r.s-off small { color: var(--t-red); }
.zb-g { width: 54px; height: 6px; border-radius: 4px; background: var(--med-line); overflow: hidden; flex: none; }
.zb-g i { display: block; height: 100%; background: var(--med-down); } .zb-g.warn i { background: #f0a33a; } .zb-g.bad i { background: var(--t-red); }
.zb-r > b { font-size: .8rem; min-width: 42px; text-align: right; flex: none; } .zb-r > b.ok { color: var(--med-down); } .zb-r > b.warn { color: #f0a33a; } .zb-r > b.bad { color: var(--t-red); }
.zb-mains { font-size: .68rem; color: var(--med-muted); flex: none; }
.zb-warn ha-icon { color: #f0a33a; }
.zb-alert { display: flex; align-items: center; gap: 8px; margin: 10px 12px 0; padding: 9px 12px; border-radius: 12px; font-size: .82rem; cursor: pointer;
  background: color-mix(in srgb, var(--t-red) 14%, transparent); border: 1px solid var(--t-red); }
.zb-alert ha-icon { color: var(--t-red); }
.ping-sum > div[data-entity] { cursor: pointer; }
</style>`;

/* ------------------------------------------------------------ carte VPN WireGuard (WGDashboard) */

const WG_DEFAULTS = {
  title: "VPN WireGuard",
  icon: "mdi:vpn",
  icon_color: "",
  expanded: false, // serveurs dépliés à l'ouverture
  show_endpoint: false, // adresse publique des pairs (au survol sinon)
  names: {}, // noms des pairs dans la carte : { "PL7aEobg": "Téléphone de secours" }
  theme: "v2",
};

/** Capteurs d'un pair WGDashboard : fin de l'identifiant. */
const WG_ROLES = [
  ["up", "binary_sensor", /_connected$/],
  ["hs", "sensor", /_last_handshake$/],
  ["rx", "sensor", /_data_received$/],
  ["tx", "sensor", /_data_sent$/],
];

class ServeurHaWireguardCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-wireguard-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...WG_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    this._open = new Set(this._config.expanded ? ["*"] : []);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const fold = ev.target.closest?.("[data-fold]");
        if (fold) {
          // serveur : déplier ou replier la liste de ses pairs
          ev.stopPropagation();
          const k = fold.dataset.fold;
          if (this._open.has("*")) { this._open = new Set(this._keys || []); this._open.delete(k); }
          else if (this._open.has(k)) this._open.delete(k);
          else this._open.add(k);
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
    return 5;
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

  /** Serveurs WGDashboard (un appareil par interface) et leurs pairs. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass;
    const reg = hass.entities || {}, devs = hass.devices || {};
    const servers = {};
    for (const [id, e] of Object.entries(reg)) {
      if (e.platform !== "wgdashboard_monitor" || !hass.states[id] || e.hidden) continue;
      const key = e.device_id || "wg";
      const dev = devs[e.device_id];
      const srv = (servers[key] ||= { key, dev, name: dev?.name_by_user || dev?.name || "WireGuard", peers: {}, count: null });
      if (/_connected_peers$/.test(id)) { srv.count = id; continue; }
      const domain = id.split(".")[0];
      const role = WG_ROLES.find(([, d, re]) => d === domain && re.test(id));
      if (!role) continue;
      const pk = id.split(".")[1].replace(role[2], "");
      const p = (srv.peers[pk] ||= { key: pk, roles: {} });
      p.roles[role[0]] = id;
    }
    // nom du pair : nom affiché sans le nom du serveur ni la fin (« connected », « last handshake »…)
    const list = Object.values(servers).map((s) => {
      const peers = Object.values(s.peers).map((p) => {
        const anyId = p.roles.up || p.roles.hs || p.roles.rx || p.roles.tx;
        const fn = String(this._st(anyId)?.attributes?.friendly_name || p.key);
        const raw = fn.replace(s.dev?.name || "", "").replace(/\s+(connected|last handshake|data received|data sent|connecté|dernier handshake|données reçues|données envoyées)\s*$/i, "").trim() || p.key;
        // option names : nom d'origine, identifiant du pair ou entité → nom affiché (« serveur/nom » pour un seul serveur)
        const names = this._config.names && typeof this._config.names === "object" ? this._config.names : {};
        const keys = [`${(/\(([^)]+)\)/.exec(s.name) || [, s.name])[1]}/${raw}`, raw, p.key, ...Object.values(p.roles)].map((x) => String(x).toLowerCase());
        const hit = Object.entries(names).find(([k]) => keys.includes(String(k).trim().toLowerCase()));
        return { ...p, name: hit ? String(hit[1]) : raw, raw };
      }).sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
      // nom court du serveur : « WGDashboard (wg0) » → « wg0 »
      const short = (/\(([^)]+)\)/.exec(s.name) || [, s.name])[1];
      return { ...s, short, peers };
    }).sort((a, b) => a.short.localeCompare(b.short, "fr", { numeric: true }));
    this._map = { servers: list };
    return this._map;
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    this._keys = m.servers.map((s) => s.key);
    const ids = m.servers.flatMap((s) => [s.count, ...s.peers.flatMap((p) => Object.values(p.roles))]);
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${[...this._open].join(",")}|${Math.floor(Date.now() / 60000)}|` + ids.map((id) => this._st(id)?.state ?? "-").join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const open = (k) => this._open.has("*") || this._open.has(k);
    const go = (v) => (v === null ? "—" : v >= 1000 ? `${fmt(v / 1000, 2)} To` : v >= 1 ? `${fmt(v, v < 10 ? 2 : 1)} Go` : `${fmt(v * 1000, 0)} Mo`);
    const gb = (id) => {
      const v = this._num(id);
      if (v === null) return null;
      const u = String(this._st(id)?.attributes?.unit_of_measurement || "GB").toUpperCase();
      return u === "TB" ? v * 1000 : u === "MB" ? v / 1000 : u === "KB" ? v / 1e6 : u === "B" ? v / 1e9 : v;
    };
    const isUp = (p) => this._st(p.roles.up)?.state === "on";
    const hsAgo = (p) => { const s = this._st(p.roles.hs)?.state; return s && s !== "unknown" && s !== "unavailable" ? since(s) : null; };

    const peerTile = (p) => {
      const up = isUp(p);
      const rx = gb(p.roles.rx), tx = gb(p.roles.tx);
      const a = this._st(p.roles.hs)?.attributes || {};
      const ep = a.endpoint && a.endpoint !== "(none)" ? a.endpoint : null;
      const hs = hsAgo(p);
      const line1 = up ? (hs ? `Handshake il y a ${hs}` : "Connecté") : hs ? `Vu il y a ${hs}` : "Jamais connecté";
      const title = [p.name, p.raw !== p.name ? `(${p.raw})` : null, up ? "Connecté" : "Déconnecté", a.allowed_ips ? `IP VPN ${a.allowed_ips}` : null, ep ? `Point d'accès ${ep}` : null, hs ? `Dernier handshake il y a ${hs}` : null].filter(Boolean).join(" · ");
      return `<div class="wg-p ${up ? "up" : ""}" data-entity="${esc(p.roles.up || p.roles.hs || "")}" title="${esc(title)}">
          <i></i><div class="wg-pn"><span>${esc(p.name)}</span><small>${esc(line1)}${a.allowed_ips ? ` · ${esc(String(a.allowed_ips).replace(/\/32$/, ""))}` : ""}${c.show_endpoint && ep ? ` · ${esc(ep)}` : ""}</small></div>
          <div class="wg-pd"><span title="Reçu par le serveur"><ha-icon icon="mdi:arrow-down"></ha-icon>${go(rx)}</span><span title="Envoyé par le serveur"><ha-icon icon="mdi:arrow-up"></ha-icon>${go(tx)}</span></div>
        </div>`;
    };

    const all = m.servers.flatMap((s) => s.peers);
    const upN = all.filter(isUp).length;
    const rxT = all.reduce((a, p) => a + (gb(p.roles.rx) || 0), 0), txT = all.reduce((a, p) => a + (gb(p.roles.tx) || 0), 0);

    const serversHtml = m.servers.map((s) => {
      const on = s.peers.filter(isUp);
      const totalRaw = Number(this._st(s.count)?.attributes?.total_peers);
      const total = Number.isFinite(totalRaw) ? totalRaw : s.peers.length;
      const isOpen = open(s.key);
      const dots = s.peers.map((p) => `<i class="${isUp(p) ? "ok" : "na"}"></i>`).join("");
      return `<div class="ping-g ${isOpen ? "open" : ""}">
        <button class="ping-gh" data-fold="${esc(s.key)}" aria-expanded="${isOpen}"><ha-icon icon="mdi:server-network"></ha-icon><span class="ping-gl">${esc(s.short)}</span>
          <span class="ping-dots">${dots}</span><b class="${on.length ? "ok" : "off"}">${on.length}/${total}</b><ha-icon class="ping-chev" icon="${esc(isOpen ? "mdi:chevron-up" : "mdi:chevron-down")}"></ha-icon></button>
        ${isOpen ? `<div class="wg-list">${s.peers.map(peerTile).join("")}</div>`
          : on.length ? `<div class="wg-on">${on.map((p) => `<span class="omv-svc on" data-entity="${esc(p.roles.up)}"><i></i>${esc(p.name)}</span>`).join("")}</div>` : ""}
      </div>`;
    }).join("");

    const body = !m.servers.length
      ? `<div class="empty">Aucun serveur WireGuard trouvé<span>Installez l'intégration WGDashboard Monitor (HACS) et ajoutez votre WGDashboard dans Paramètres › Appareils et services, puis rechargez la page.</span></div>`
      : `<div class="ping-sum">
          <div class="${upN ? "ok" : ""}"><b>${upN}<small>/${all.length}</small></b><span>pairs connectés</span></div>
          <div><b>${m.servers.length}</b><span>serveur${m.servers.length > 1 ? "s" : ""}</span></div>
          <div><b>${go(rxT)}</b><span>reçu</span></div>
          <div><b>${go(txT)}</b><span>envoyé</span></div>
        </div><div class="srv-sec ping-groups">${serversHtml}</div>`;
    const leds = m.servers.length ? `<span class="srv-led ${upN ? "ok" : "na"}"><i></i>${upN ? `${upN} connecté${upN > 1 ? "s" : ""}` : "Aucun pair connecté"}</span>` : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${PVE_STYLE}${OMV_STYLE}${PING_STYLE}${WG_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:vpn")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
          <div><div class="title">${esc(c.title || "VPN WireGuard")}</div><div class="sub">${m.servers.length ? m.servers.map((s) => esc(s.short)).join(" · ") : "WGDashboard"}</div></div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const WG_STYLE = `<style>
.ping-gh b.off { color: var(--med-muted); }
.wg-on { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 10px 10px; }
.wg-list { display: grid; gap: 6px; padding: 0 8px 8px; }
.wg-p { display: grid; grid-template-columns: 9px 1fr auto; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--med-line); background: var(--med-surface); min-width: 0; }
.wg-p > i { width: 9px; height: 9px; border-radius: 50%; background: var(--med-muted); }
.wg-p.up { border-color: color-mix(in srgb, var(--med-down) 45%, transparent); } .wg-p.up > i { background: var(--med-down); }
.wg-p:not(.up) .wg-pn span { color: var(--med-muted); }
.wg-pn { display: grid; min-width: 0; }
.wg-pn span { font-size: .8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wg-pn small { font-size: .68rem; color: var(--med-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wg-pd { display: grid; gap: 1px; justify-items: end; font-size: .72rem; color: var(--med-muted); white-space: nowrap; }
.wg-pd span { display: inline-flex; align-items: center; gap: 2px; } .wg-pd ha-icon { --mdc-icon-size: 13px; }
</style>`;

/* ------------------------------------------------------------ carte Serveurs Glances */

const GL_DEFAULTS = {
  title: "Serveurs Glances",
  icon: "mdi:monitor-dashboard",
  icon_color: "",
  expanded: false, // hôtes dépliés à l'ouverture
  temp_warn: 70, temp_alert: 85, // °C
  net_max: 1000, // Mbit/s, pleine échelle des barres réseau
  theme: "v2",
};

/** Capteurs d'un hôte Glances : clé de traduction, sinon fin de l'identifiant (français ou anglais). */
const GL_ROLES = [
  ["cpu", /^cpu_use_percent$/, /_(utilisation_du_processeur|cpu_used|cpu_usage)(_\d+)?$/],
  ["load", /^processor_load$/, /_(charge_du_processeur|cpu_load)(_\d+)?$/],
  ["mem", /^memory_use_percent$/, /_(utilisation_de_la_memoire|ram_used_percent|memory_usage)(_\d+)?$/],
  ["mem_used", /^memory_use$/, /_(memoire_utilisee|ram_used|memory_use)(_\d+)?$/],
  ["mem_free", /^memory_free$/, /_(memoire_libre|ram_free|memory_free)(_\d+)?$/],
  ["swap", /^swap_use_percent$/, /_(utilisation_de_l_espace_d_echange|swap_used_percent|swap_usage)(_\d+)?$/],
  ["uptime", /^uptime$/, /_(temps_de_fonctionnement|uptime)(_\d+)?$/],
  ["procs", /^process_total$/, /_(total|processes_total)(_\d+)?$/],
  ["threads", /^process_thread$/, /_threads(_\d+)?$/],
  ["running", /^process_running$/, /_(en_cours_d_execution|running)(_\d+)?$/],
  ["containers", /^container_active$/, /_(conteneurs_actifs|containers_active)(_\d+)?$/],
];

class ServeurHaGlancesCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-glances-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...GL_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    this._open = new Set(this._config.expanded ? ["*"] : []);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const fold = ev.target.closest?.("[data-fold]");
        if (fold) {
          // hôte : déplier ou replier le détail
          ev.stopPropagation();
          const k = fold.dataset.fold;
          if (this._open.has("*")) { this._open = new Set(this._keys || []); this._open.delete(k); }
          else if (this._open.has(k)) this._open.delete(k);
          else this._open.add(k);
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
    return 6;
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

  _unit(id, d = "") {
    return cleanUnit(this._st(id)?.attributes?.unit_of_measurement ?? d);
  }

  /** Hôtes Glances (un appareil par serveur) : rôles, disques par point de montage, températures, ventilateurs, réseau, GPU. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass;
    const reg = hass.entities || {}, devs = hass.devices || {};
    const hosts = {};
    for (const [id, e] of Object.entries(reg)) {
      if (e.platform !== "glances" || !hass.states[id] || e.hidden || !id.startsWith("sensor.")) continue;
      const key = e.device_id || "glances";
      const dev = devs[e.device_id];
      const h = (hosts[key] ||= { key, dev, name: dev?.name_by_user || dev?.name || "Glances", roles: {}, fs: {}, temps: [], fans: [], net: {}, gpu: {} });
      const st = hass.states[id], a = st.attributes || {}, tk = e.translation_key || "";
      const fname = String(a.friendly_name || id).replace(h.name, "").trim();
      const unit = cleanUnit(a.unit_of_measurement);
      // GPU avant la mémoire et le processeur : ses capteurs finissent aussi par « utilisation de la mémoire »
      if (/gpu/i.test(tk) || /_gpu_/.test(id)) {
        if (/temp/i.test(tk) || a.device_class === "temperature") h.temps.push({ id, label: "GPU" });
        else if (/memory|memoire/i.test(tk + id)) h.gpu.mem ||= id;
        else if (/processor|processeur/i.test(tk + id)) h.gpu.cpu ||= id;
        continue;
      }
      if (/^disk_use_percent$/.test(tk) || /_(utilisation_disque|disk_used_percent|disk_usage)(_|$)/.test(id)) { const m = (/(\/\S*)\s*$/.exec(fname) || [, "/"])[1]; (h.fs[m] ||= {}).pct = id; continue; }
      if (/^disk_use$/.test(tk) || /_(espace_utilise|disk_used)(_|$)/.test(id)) { const m = (/(\/\S*)\s*$/.exec(fname) || [, "/"])[1]; (h.fs[m] ||= {}).used = id; continue; }
      if (/^disk_size$/.test(tk) || /_(taille_du_disque|disk_size)(_|$)/.test(id)) { const m = (/(\/\S*)\s*$/.exec(fname) || [, "/"])[1]; (h.fs[m] ||= {}).size = id; continue; }
      if (/^disk_free$/.test(tk) || /_(espace_libre|disk_free)(_|$)/.test(id)) continue;
      if (a.device_class === "temperature" || /^temperature/.test(tk)) { h.temps.push({ id, label: fname.replace(/^(température|temperature)\s*/i, "") || "Température" }); continue; }
      if (/rpm/i.test(unit) || /^fan_speed$/.test(tk)) { h.fans.push({ id, label: fname.replace(/^(vitesse ventilateur|fan speed)\s*/i, "") || "Ventilateur" }); continue; }
      const net = /_([a-z0-9]+)_(rx|tx)$/.exec(id);
      if (net && /bit\/s|B\/s/i.test(unit)) { (h.net[net[1]] ||= {})[net[2]] = id; continue; }
      if (/diskio|lecture_disque|ecriture_disque|disk_read|disk_write/.test(tk + id)) continue;
      const role = GL_ROLES.find(([, tre, re]) => (tk && tre.test(tk)) || (!tk && re.test(id)) || re.test(id));
      if (role && !h.roles[role[0]]) h.roles[role[0]] = id;
    }
    const list = Object.values(hosts).sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
    this._map = { hosts: list };
    return this._map;
  }

  /** Température principale : processeur (Package, Tctl, Tdie, CPU), sinon la plus haute. */
  _mainTemp(h) {
    const vals = h.temps.map((t) => ({ ...t, v: this._num(t.id) })).filter((t) => t.v !== null && t.v > 0);
    if (!vals.length) return null;
    const cpu = vals.find((t) => /package id 0|tctl|tdie|^cpu$|cputin|coretemp|cpu_thermal|soc/i.test(t.label));
    return cpu || vals.reduce((a, b) => (b.v > a.v ? b : a));
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    this._keys = m.hosts.map((h) => h.key);
    const ids = m.hosts.flatMap((h) => [...Object.values(h.roles), ...Object.values(h.fs).flatMap((f) => Object.values(f)), ...h.temps.map((t) => t.id), ...h.fans.map((f) => f.id), ...Object.values(h.net).flatMap((n) => Object.values(n)), ...Object.values(h.gpu)]);
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${[...this._open].join(",")}|${Math.floor(Date.now() / 60000)}|` + ids.map((id) => this._st(id)?.state ?? "-").join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const tw = Number(c.temp_warn) || 70, ta = Number(c.temp_alert) || 85;
    const open = (k) => this._open.has("*") || this._open.has(k);
    const sec = (icon, t, body) => (body ? `<div class="gl-sub"><div class="gl-subh"><ha-icon icon="${esc(icon)}"></ha-icon>${t}</div>${body}</div>` : "");
    const gauge = (id, icon, label, v, sub, warn = 75, alert = 90, unit = " %", max = 100, digits = 0) => (v === null ? "" : `<div class="srv-g" data-entity="${esc(id)}">
        <div class="srv-gt"><span><ha-icon icon="${esc(icon)}"></ha-icon>${label}</span><b>${fmt(v, digits)}<small>${unit}</small></b></div>
        <div class="g-bar ${level((v / max) * 100, warn, alert)}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i></div>${sub ? `<div class="srv-gs">${sub}</div>` : ""}</div>`);
    const go = (id) => { const v = this._num(id); if (v === null) return null; const u = this._unit(id, "GiB"); const g = /^TiB|^TB/i.test(u) ? v * 1024 : /^MiB|^MB/i.test(u) ? v / 1024 : v; return g >= 1024 ? `${fmt(g / 1024, 2)} To` : `${fmt(g, g < 10 ? 1 : 0)} Go`; };
    const tcls = (v) => (v === null ? "" : v >= ta ? "bad" : v >= tw ? "warn" : "ok");
    const pcls = (v, w, a) => (v === null ? "" : v >= a ? "bad" : v >= w ? "warn" : "ok");

    let alerts = 0;
    const hostsHtml = m.hosts.map((h) => {
      const r = h.roles;
      const online = this._num(r.cpu) !== null || this._num(r.mem) !== null;
      const cpu = this._num(r.cpu), mem = this._num(r.mem);
      const fsList = Object.entries(h.fs).filter(([, f]) => f.pct).sort(([a], [b]) => a.localeCompare(b));
      const diskMax = fsList.reduce((mx, [, f]) => Math.max(mx, this._num(f.pct) ?? -1), -1);
      const t = this._mainTemp(h);
      const bad = !online || (t && t.v >= ta) || (cpu !== null && cpu >= 90) || (mem !== null && mem >= 92) || diskMax >= 90;
      if (bad) alerts++;
      const up = this._st(r.uptime)?.state;
      const upTxt = up && !/unknown|unavailable/.test(up) ? since(up) : null;
      const isOpen = open(h.key);
      const chip = (label, v, cls, unit = "%") => (v === null || v < 0 ? "" : `<span class="gl-c ${cls}"><small>${label}</small>${fmt(v, 0)}${unit === "%" ? "<small>%</small>" : `<small>${unit}</small>`}</span>`);
      const chips = online
        ? [chip("CPU", cpu, pcls(cpu, 70, 90)), chip("RAM", mem, pcls(mem, 80, 92)), chip("Disque", diskMax, pcls(diskMax, 80, 90)), t ? chip("Temp.", t.v, tcls(t.v), "°C") : ""].join("")
        : `<span class="gl-c bad">Injoignable</span>`;

      let detail = "";
      if (isOpen && online) {
        const memUsed = go(r.mem_used), memTot = (() => { const u = this._num(r.mem_used), f = this._num(r.mem_free); return u !== null && f !== null ? `${fmt(u + f, 1)} Go` : null; })();
        const swap = this._num(r.swap);
        const tiles = [
          upTxt ? `<div class="tile srv-t" data-entity="${esc(r.uptime)}"><div class="tile-l"><ha-icon icon="mdi:clock-start"></ha-icon>Uptime</div><div class="nas-up">${esc(upTxt)}</div></div>` : "",
          this._num(r.load) !== null ? `<div class="tile srv-t" data-entity="${esc(r.load)}"><div class="tile-l"><ha-icon icon="mdi:chart-line-variant"></ha-icon>Charge</div><div class="nas-up">${fmt(this._num(r.load), 2)}</div></div>` : "",
          this._num(r.procs) !== null ? `<div class="tile srv-t" data-entity="${esc(r.procs)}"><div class="tile-l"><ha-icon icon="mdi:format-list-bulleted"></ha-icon>Processus</div><div class="nas-up">${fmt(this._num(r.procs), 0)}</div>${this._num(r.threads) !== null ? `<div class="tile-n">${fmt(this._num(r.threads), 0)} threads</div>` : ""}</div>` : "",
          this._num(r.containers) !== null ? `<div class="tile srv-t" data-entity="${esc(r.containers)}"><div class="tile-l"><ha-icon icon="mdi:docker"></ha-icon>Conteneurs</div><div class="nas-up">${fmt(this._num(r.containers), 0)}</div></div>` : "",
        ].filter(Boolean);
        const res = [
          gauge(r.cpu, "mdi:cpu-64-bit", "CPU", cpu, "", 70, 90),
          gauge(r.mem, "mdi:memory", "RAM", mem, memUsed && memTot ? `${memUsed} / ${memTot}` : "", 80, 92),
          swap !== null && swap > 0 ? gauge(r.swap, "mdi:swap-horizontal", "Swap", swap, "", 50, 80) : "",
          gauge(h.gpu.cpu, "mdi:expansion-card", "GPU", this._num(h.gpu.cpu), this._num(h.gpu.mem) !== null ? `Mémoire ${fmt(this._num(h.gpu.mem), 0)} %` : "", 80, 95),
        ].filter(Boolean);
        const disks = fsList.map(([mount, f]) => gauge(f.pct, "mdi:harddisk", esc(mount), this._num(f.pct), go(f.used) && go(f.size) ? `${go(f.used)} / ${go(f.size)}` : "", 80, 90));
        const temps = h.temps.map((x) => ({ ...x, v: this._num(x.id) })).filter((x) => x.v !== null && x.v > 0).sort((a, b) => b.v - a.v)
          .map((x) => `<span class="gl-t ${tcls(x.v)}" data-entity="${esc(x.id)}" title="${esc(x.label)}"><span>${esc(x.label.length > 22 ? `${x.label.slice(0, 21)}…` : x.label)}</span><b>${fmt(x.v, 0)} °C</b></span>`);
        const fans = h.fans.map((x) => ({ ...x, v: this._num(x.id) })).filter((x) => x.v !== null && x.v > 0)
          .map((x) => `<span class="gl-t" data-entity="${esc(x.id)}" title="${esc(x.label)}"><span>${esc(x.label.length > 22 ? `${x.label.slice(0, 21)}…` : x.label)}</span><b>${fmt(x.v, 0)} tr/min</b></span>`);
        const netMax = Number(c.net_max) || 1000;
        const nets = Object.entries(h.net).flatMap(([n, x]) => [
          x.rx ? gauge(x.rx, "mdi:download", `${esc(n)}`, this._num(x.rx), "Réception", 101, 101, ` ${esc(this._unit(x.rx, "Mbit/s"))}`, netMax, (this._num(x.rx) ?? 0) < 10 ? 2 : 0).replace('class="srv-g"', 'class="srv-g srv-in"') : "",
          x.tx ? gauge(x.tx, "mdi:upload", `${esc(n)}`, this._num(x.tx), "Envoi", 101, 101, ` ${esc(this._unit(x.tx, "Mbit/s"))}`, netMax, (this._num(x.tx) ?? 0) < 10 ? 2 : 0).replace('class="srv-g"', 'class="srv-g srv-out"') : "",
        ]).filter(Boolean);
        detail = `<div class="gl-d">
          ${tiles.length ? `<div class="tiles srv-tiles">${tiles.join("")}</div>` : ""}
          ${res.length ? `<div class="srv-grid pve-res">${res.join("")}</div>` : ""}
          ${sec("mdi:harddisk", "Disques", disks.length ? `<div class="srv-grid pve-res">${disks.join("")}</div>` : "")}
          ${sec("mdi:thermometer", "Températures", temps.length ? `<div class="gl-ts">${temps.join("")}</div>` : "")}
          ${sec("mdi:fan", "Ventilateurs", fans.length ? `<div class="gl-ts">${fans.join("")}</div>` : "")}
          ${sec("mdi:swap-vertical", "Réseau", nets.length ? `<div class="srv-grid">${nets.join("")}</div>` : "")}
        </div>`;
      }
      return `<div class="ping-g gl-h ${isOpen ? "open" : ""} ${bad ? "alert" : ""}">
        <button class="ping-gh" data-fold="${esc(h.key)}" aria-expanded="${isOpen}"><ha-icon icon="mdi:server"></ha-icon>
          <span class="gl-hn"><span class="ping-gl">${esc(h.name)}</span>${upTxt && online ? `<small>depuis ${esc(upTxt)}</small>` : ""}</span>
          <span class="gl-cs">${chips}</span><ha-icon class="ping-chev" icon="${esc(isOpen ? "mdi:chevron-up" : "mdi:chevron-down")}"></ha-icon></button>
        ${detail}
      </div>`;
    }).join("");

    const body = !m.hosts.length
      ? `<div class="empty">Aucun serveur Glances trouvé<span>Installez Glances (mode web, glances -w) sur vos serveurs, puis ajoutez l'intégration Glances dans Paramètres › Appareils et services.</span></div>`
      : `<div class="srv-sec ping-groups">${hostsHtml}</div>`;
    const leds = m.hosts.length ? `<span class="srv-led ${alerts ? "bad" : "ok"}"><i></i>${alerts ? `${alerts} à surveiller` : "Tout va bien"}</span>` : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${NAS_STYLE}${PVE_STYLE}${PING_STYLE}${GL_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${alerts ? "srv-alert" : ""}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:monitor-dashboard")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
          <div><div class="title">${esc(c.title || "Serveurs Glances")}</div><div class="sub">${m.hosts.length} serveur${m.hosts.length > 1 ? "s" : ""} · ${m.hosts.map((h) => esc(h.name)).join(" · ")}</div></div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const GL_STYLE = `<style>
.gl-h.alert { border-color: color-mix(in srgb, var(--t-red) 55%, transparent); }
.gl-hn { display: grid; min-width: 0; } .gl-hn small { font-size: .68rem; color: var(--med-muted); font-weight: 400; }
.gl-cs { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.gl-c { display: inline-flex; align-items: baseline; gap: 3px; padding: 3px 8px; border-radius: 999px; font-size: .78rem; font-weight: 700;
  border: 1px solid var(--med-line); background: var(--med-surface); white-space: nowrap; }
.gl-c small { font-size: .62rem; color: var(--med-muted); font-weight: 500; }
@container (max-width: 480px) {
  .gl-h .ping-gh { flex-wrap: wrap; }
  .gl-h .gl-hn { flex: 1; }
  .gl-cs { order: 3; flex-basis: 100%; display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); justify-content: stretch; }
  .gl-c { justify-content: center; padding: 3px 4px; }
}
.gl-c.ok { color: var(--med-down); } .gl-c.warn { color: #f0a33a; } .gl-c.bad { color: var(--t-red); border-color: color-mix(in srgb, var(--t-red) 55%, transparent); }
.gl-d { padding: 0 10px 10px; display: grid; gap: 8px; }
.gl-d .srv-tiles { margin: 0; }
.gl-sub { display: grid; gap: 6px; }
.gl-subh { display: flex; align-items: center; gap: 6px; font-size: .78rem; font-weight: 600; color: var(--med-muted); }
.gl-subh ha-icon { --mdc-icon-size: 16px; color: var(--med-accent, var(--med-blue)); }
.gl-ts { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 5px; }
.gl-t { display: flex; justify-content: space-between; gap: 6px; padding: 5px 9px; border-radius: 8px; cursor: pointer; font-size: .74rem;
  border: 1px solid var(--med-line); background: var(--med-surface); min-width: 0; }
.gl-t span { color: var(--med-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gl-t b { white-space: nowrap; } .gl-t.warn b { color: #f0a33a; } .gl-t.bad b { color: var(--t-red); } .gl-t.ok b { color: var(--med-down); }
</style>`;

/* ------------------------------------------------------------ carte Serveurs multimédia (Plex, Jellyfin, Emby) */

const MEDIA_DEFAULTS = {
  title: "Serveurs multimédia",
  icon: "mdi:play-box-multiple",
  icon_color: "",
  show_libraries: true,
  show_clients: true, // lecteurs connus, dépliables
  show_controls: true, // commandes de lecture (pause, arrêt, avance…)
  control_players: {}, // lecteur Plex/Jellyfin → lecteur qui commande l'appareil : { media_player.plex_tv: media_player.tv }
  show_volume: true, // volume et coupure du son, si le lecteur le permet
  volume_step: 5, // pas des boutons − et + (en %)
  sleep_timer: "", // minuteur (timer.xxx) de la minuterie de veille ; une automatisation arrête la lecture à la fin
  sleep_player: "", // lecteur concerné par la minuterie (sinon : toutes les lectures)
  sleep_durations: [15, 30, 45, 60, 90], // durées proposées (minutes)
  show_details: true, // volet Détails (résumé, classification, bibliothèque, application…)
  browse: true, // un clic sur une bibliothèque (Films, Séries, Musique) liste son contenu et lance la lecture
  browse_player: "", // lecteur choisi par défaut pour lancer la lecture
  theme: "v2",
};
/** Fonctions d'un media_player (supported_features) utilisées par les commandes. */
const MP = { PAUSE: 1, SEEK: 2, VOLUME_SET: 4, MUTE: 8, PREV: 16, NEXT: 32, PLAY_MEDIA: 512, STOP: 4096, PLAY: 16384, BROWSE: 131072 };
const BROWSE_PAGE = 60; // éléments affichés à la fois dans la liste d'une bibliothèque
const normTitle = (n) => String(n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const MEDIA_APPS = {
  plex: ["Plex", "mdi:plex", "#e5a00d"],
  jellyfin: ["Jellyfin", "mdi:jellyfish", "#aa5cc3"],
  emby: ["Emby", "mdi:emby", "#52b54b"],
};
// « Plex (Plex for Android (TV) - TV Salon) » → « TV Salon »
const mediaPlayerName = (n) => String(n || "").replace(/^(Plex|Jellyfin|Emby)\s*\((.*)\)$/i, "$2").replace(/^.* - /, "").trim();
const MEDIA_TYPES = { movie: "Film", tvshow: "Série", episode: "Épisode", music: "Musique", track: "Musique", video: "Vidéo", photo: "Photo", channel: "Chaîne" };

class ServeurHaMediaCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-media-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...MEDIA_DEFAULTS, ...(config || {}) };
    this._map = null;
    this._sig = null;
    this._open = new Set();
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("input", (ev) => {
        if (!ev.target.matches?.(".br-q") || !this._br) return;
        this._br.filter = ev.target.value;
        this._br.limit = BROWSE_PAGE;
        this._brRedraw(true);
        this._brThumbs();
      });
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const fold = ev.target.closest?.("[data-fold]");
        if (fold) {
          ev.stopPropagation();
          const k = fold.dataset.fold;
          if (this._open.has(k)) this._open.delete(k); else this._open.add(k);
          this._sig = null; this._render(); return;
        }
        const br = ev.target.closest?.("[data-br]");
        if (br) { ev.stopPropagation(); this._brAction(br); return; }
        const cmd = ev.target.closest?.("[data-mp-act]");
        if (cmd) {
          // commande de lecture : pas d'ouverture de la fiche
          ev.stopPropagation();
          const id = cmd.dataset.mp, act = cmd.dataset.mpAct;
          const data = { entity_id: id };
          if (act === "media_seek") data.seek_position = Math.max(0, Number(cmd.dataset.pos) || 0);
          if (act === "volume_set") data.volume_level = Math.min(1, Math.max(0, Number(cmd.dataset.vol) || 0));
          if (act === "volume_mute") data.is_volume_muted = cmd.dataset.mute === "true";
          if (act === "plex_resume") {
            // reprise par Plex : la TV a fermé la session Cast pendant la pause
            const a = this._hass?.states?.[id]?.attributes || {};
            const q = { library_name: a.media_library_title, resume: 1 };
            let type = "MOVIE";
            if (a.media_series_title) { type = "EPISODE"; Object.assign(q, { show_name: a.media_series_title, season_number: a.media_season, episode_number: a.media_episode }); }
            else if (a.media_artist || a.media_content_type === "music") { type = "MUSIC"; Object.assign(q, { artist_name: a.media_artist, album_name: a.media_album_name, track_name: a.media_title }); }
            else q.title = a.media_title;
            this._hass?.callService("media_player", "play_media", { entity_id: id, media_content_type: type, media_content_id: `plex://${JSON.stringify(q)}` });
            return;
          }
          if (act === "timer_start" || act === "timer_cancel") {
            // minuterie de veille : minuteur Home Assistant, l'automatisation fait le reste
            const t = this._config.sleep_timer;
            if (!t) return;
            if (act === "timer_cancel") this._hass?.callService("timer", "cancel", { entity_id: t });
            else {
              const mn = Math.max(1, Math.round(Number(cmd.dataset.min) || 30));
              this._hass?.callService("timer", "start", { entity_id: t, duration: `${String(Math.floor(mn / 60)).padStart(2, "0")}:${String(mn % 60).padStart(2, "0")}:00` });
            }
            this._open.delete(`sleep:${id}`);
            this._sig = null; this._render();
            return;
          }
          this._hass?.callService("media_player", act, data);
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
    if (this._hass?.entities !== hass.entities || this._hass?.devices !== hass.devices) this._map = null;
    this._hass = hass;
    this._render();
  }

  /** Lecteurs d'un serveur qui savent parcourir la bibliothèque et lancer une lecture. */
  _brPlayers(s) {
    return s.players.filter((id) => {
      const o = this._st(id), f = Number(o?.attributes?.supported_features) || 0;
      return o && !this._deviceOff(id) && (f & MP.BROWSE) && (f & MP.PLAY_MEDIA);
    });
  }

  _brRedraw(keepFocus) {
    const q = keepFocus ? this.shadowRoot.querySelector(".br-q") : null;
    const pos = q ? [q.selectionStart, q.selectionEnd] : null;
    this._sig = null; this._render();
    if (pos) { const n = this.shadowRoot.querySelector(".br-q"); if (n) { n.focus(); try { n.setSelectionRange(...pos); } catch (_) { /* champ sans sélection */ } } }
  }

  async _brLoad(node) {
    const b = this._br;
    if (!b) return;
    b.loading = true; b.error = ""; b.items = []; b.card = null; b.filter = ""; b.limit = BROWSE_PAGE;
    this._brRedraw();
    try {
      const ws = (id, type) => this._hass.callWS(id ? { type: "media_player/browse_media", entity_id: b.browser, media_content_id: id, media_content_type: type } : { type: "media_player/browse_media", entity_id: b.browser });
      let res = await ws(node?.id, node?.type);
      // première ouverture : on descend jusqu'à la bibliothèque demandée (Films, Séries TV, Musique…)
      if (!node?.id && b.lib) {
        const want = normTitle(b.lib);
        const find = (r) => (r?.children || []).find((x) => normTitle(x.title) === want);
        let hit = find(res);
        for (const x of hit ? [] : (res?.children || []).filter((y) => y.can_expand).slice(0, 3)) {
          hit = find(await ws(x.media_content_id, x.media_content_type));
          if (hit) break;
        }
        if (hit) {
          res = await ws(hit.media_content_id, hit.media_content_type);
          b.stack = [{ id: hit.media_content_id, type: hit.media_content_type, title: hit.title }];
        } else b.stack = [{ id: "", type: "", title: res?.title || "Bibliothèque" }];
      }
      if (this._br !== b) return;
      b.items = (res?.children || []).map((x) => ({ id: x.media_content_id, type: x.media_content_type, title: x.title, play: !!x.can_play, open: !!x.can_expand, thumb: x.thumbnail || "" }));
    } catch (e) {
      b.error = `Lecture de la bibliothèque impossible : ${e?.message || e}`;
    }
    b.loading = false;
    if (this._br === b) { this._brRedraw(); this._brThumbs(); }
  }

  /** Jaquettes servies par Home Assistant : adresse signée, demandée pour les éléments affichés seulement. */
  async _brThumbs() {
    const b = this._br;
    if (!b || typeof this._hass?.callWS !== "function") return;
    this._thumbs ||= new Map();
    const todo = this._brVisible().map((x) => x.thumb).filter((t) => t && t.startsWith("/") && !this._thumbs.has(t)).slice(0, BROWSE_PAGE);
    if (!todo.length) return;
    await Promise.all(todo.map(async (t) => {
      try { this._thumbs.set(t, (await this._hass.callWS({ type: "auth/sign_path", path: t, expires: 3600 })).path); } catch (_) { this._thumbs.set(t, ""); }
    }));
    if (this._br === b) this._brRedraw(!!this.shadowRoot.activeElement?.matches?.(".br-q"));
  }

  _brMatches() {
    const b = this._br, q = normTitle(b?.filter);
    return !b ? [] : q ? b.items.filter((x) => normTitle(x.title).includes(q)) : b.items;
  }

  _brVisible() { return this._brMatches().slice(0, this._br?.limit || BROWSE_PAGE); }

  _brAction(el) {
    const act = el.dataset.br, b = this._br;
    if (act === "lib") {
      const s = this._resolve().servers.find((x) => x.key === el.dataset.srv);
      if (!s) return;
      if (b && b.srv === s.key && b.lib === el.dataset.lib) { this._br = null; this._brRedraw(); return; }
      const players = this._brPlayers(s);
      // pour parcourir seulement, n'importe quel lecteur du serveur qui sait naviguer suffit
      const browser = players[0] || s.players.find((id) => this._st(id) && this._st(id).state !== "unavailable" && ((Number(this._st(id).attributes?.supported_features) || 0) & MP.BROWSE));
      const now = players.find((id) => /^(playing|paused|buffering)$/.test(this._st(id)?.state || ""));
      const player = players.includes(this._config.browse_player) ? this._config.browse_player : now || players[0];
      // sans capteurs de bibliothèque : on part de la liste des bibliothèques du serveur
      this._br = { srv: s.key, lib: el.dataset.lib, player, browser, stack: el.dataset.lib ? [] : [{ id: "", type: "", title: "Bibliothèques" }], items: [], filter: "", limit: BROWSE_PAGE, msg: "" };
      if (!browser) { this._br.error = "Aucun lecteur disponible : allumez la TV et ouvrez Plex (ou Jellyfin), puis réessayez."; this._brRedraw(); return; }
      this._brLoad(null);
      return;
    }
    if (!b) return;
    if (act === "close") { this._br = null; this._brRedraw(); return; }
    if (act === "uncard") { b.card = null; this._brRedraw(); return; }
    if (act === "player") { b.player = el.dataset.id; b.msg = ""; this._brRedraw(); return; }
    if (act === "more") { b.limit += BROWSE_PAGE; this._brRedraw(); this._brThumbs(); return; }
    if (act === "back") {
      if (b.card != null) { b.card = null; this._brRedraw(); return; }
      if (b.stack.length < 2) { this._br = null; this._brRedraw(); return; }
      b.stack.pop();
      this._brLoad(b.stack[b.stack.length - 1]);
      return;
    }
    const item = b.items[Number(el.dataset.i)];
    if (!item) return;
    if (act === "card") { b.card = Number(el.dataset.i); this._brRedraw(); return; }
    if (act === "open") { b.card = null; b.stack.push({ id: item.id, type: item.type, title: item.title }); this._brLoad(item); return; }
    if (act === "play") {
      if (!b.player) return;
      const name = mediaPlayerName(this._st(b.player)?.attributes?.friendly_name) || b.player;
      b.msg = `Lecture de « ${item.title} » sur ${name}…`;
      this._brRedraw();
      Promise.resolve(this._hass.callService("media_player", "play_media", { entity_id: b.player, media_content_id: item.id, media_content_type: item.type }))
        .then(() => { if (this._br === b) { b.msg = `« ${item.title} » lancé sur ${name}.`; this._brRedraw(); } })
        .catch((e) => { if (this._br === b) { b.msg = `Échec : ${e?.message || e}`; this._brRedraw(); } });
    }
  }

  _brPanel(s) {
    const b = this._br, players = this._brPlayers(s);
    if (b.player && !players.includes(b.player)) b.player = players[0] || "";
    else if (!b.player && players.length) b.player = players[0];
    const title = b.stack.length ? b.stack[b.stack.length - 1].title : b.lib || "Bibliothèques";
    const vis = this._brVisible(), total = this._brMatches().length;
    const img = (x) => {
      const u = x.thumb ? (x.thumb.startsWith("/") ? this._thumbs?.get(x.thumb) : x.thumb) : "";
      return u ? `<img src="${esc(u)}" alt="" loading="lazy">` : `<ha-icon icon="${esc(x.open && !x.play ? "mdi:folder-play-outline" : "mdi:movie-open-outline")}"></ha-icon>`;
    };
    const rows = vis.map((x) => {
      const i = b.items.indexOf(x);
      return `<div class="br-it">
          <button class="br-th" data-br="card" data-i="${i}" title="Voir la fiche" aria-label="Fiche de ${esc(x.title)}">${img(x)}</button>
          ${x.open ? `<button class="br-t" data-br="open" data-i="${i}" title="Ouvrir">${esc(x.title)}<ha-icon icon="mdi:chevron-right"></ha-icon></button>` : `<span class="br-t">${esc(x.title)}</span>`}
          ${x.play && b.player ? `<button class="md-b" data-br="play" data-i="${i}" title="Lire" aria-label="Lire ${esc(x.title)}"><ha-icon icon="mdi:play"></ha-icon></button>` : ""}
        </div>`;
    }).join("");
    const pname = (id) => mediaPlayerName(this._st(id)?.attributes?.friendly_name) || id;
    // fiche agrandie d'un élément (clic sur la jaquette)
    const cardItem = b.card != null ? b.items[b.card] : null;
    const TYPES = { movie: "Film", show: "Série", tvshow: "Série", season: "Saison", episode: "Épisode", artist: "Artiste", album: "Album", track: "Morceau", playlist: "Liste de lecture" };
    const fiche = cardItem ? (() => {
      const x = cardItem, i = b.card;
      const m = String(x.title).match(/^(.*?)\s*\((\d{4})\)\s*$/);
      const u = x.thumb ? (x.thumb.startsWith("/") ? this._thumbs?.get(x.thumb) : x.thumb) : "";
      const meta = [TYPES[String(x.type).toLowerCase()], m?.[2]].filter(Boolean).join(" · ");
      return `<div class="br-card">
          <div class="br-big">${u ? `<img src="${esc(u)}" alt="">` : `<ha-icon icon="mdi:movie-open-outline"></ha-icon>`}</div>
          <div class="br-ci"><b>${esc(m ? m[1] : x.title)}</b>${meta ? `<small>${esc(meta)}</small>` : ""}
            <div class="br-ca">
              ${x.play && b.player ? `<button class="br-go" data-br="play" data-i="${i}"><ha-icon icon="mdi:play"></ha-icon>Lire sur ${esc(pname(b.player))}</button>` : ""}
              ${x.open ? `<button class="md-chip" data-br="open" data-i="${i}"><ha-icon icon="mdi:folder-open-outline"></ha-icon> Ouvrir</button>` : ""}
              <button class="md-chip" data-br="uncard"><ha-icon icon="mdi:arrow-left"></ha-icon> Retour à la liste</button>
            </div></div>
        </div>`;
    })() : "";
    // TV éteinte : bouton pour l'allumer si son lecteur (Cast, Android TV…) le permet
    const wake = b.player ? "" : [...new Set(s.players.map((id) => this._twin(id)).filter(Boolean))]
      .filter((t) => { const o = this._st(t); return o && o.state !== "unavailable" && ((Number(o.attributes?.supported_features) || 0) & 128); })
      .map((t) => `<button class="md-chip" data-mp="${esc(t)}" data-mp-act="turn_on"><ha-icon icon="mdi:power"></ha-icon> Allumer ${esc(pname(t))}</button>`).join("");
    return `<div class="br">
        <div class="br-h">
          <button class="md-b" data-br="back" title="Retour" aria-label="Retour"><ha-icon icon="mdi:arrow-left"></ha-icon></button>
          <b>${esc(title)}</b>${b.items.length ? `<small>${total}</small>` : ""}
          <button class="md-b" data-br="close" title="Fermer" aria-label="Fermer"><ha-icon icon="mdi:close"></ha-icon></button>
        </div>
        ${players.length > 1 ? `<div class="br-pl"><small>Lire sur</small>${players.map((id) => `<button class="md-chip ${id === b.player ? "on" : ""}" data-br="player" data-id="${esc(id)}">${esc(pname(id))}</button>`).join("")}</div>`
          : b.player ? `<div class="br-pl"><small>Lire sur ${esc(pname(b.player))}</small></div>` : `<div class="br-pl"><small>Aucun lecteur allumé : allumez la TV et ouvrez Plex pour lancer une lecture.</small>${wake}</div>`}
        ${!fiche && b.items.length > 12 ? `<input class="br-q" type="search" placeholder="Rechercher…" aria-label="Rechercher" value="${esc(b.filter)}">` : ""}
        ${b.msg ? `<div class="br-msg">${esc(b.msg)}</div>` : ""}
        ${b.error ? `<div class="br-msg err">${esc(b.error)}</div>` : b.loading ? `<div class="br-msg">Chargement…</div>` : !b.items.length ? `<div class="br-msg">Rien à afficher.</div>` : fiche || `<div class="br-ls">${rows}</div>`}
        ${!fiche && vis.length < total ? `<button class="md-more" data-br="more">Afficher plus (${total - vis.length} de plus)</button>` : ""}
      </div>`;
  }

  /** Lecteur qui commande une session : la session elle-même si elle accepte la pause, sinon celui indiqué
   *  dans control_players, sinon un lecteur d'une autre intégration qui porte le même nom (ex. la TV). */
  /** Lecteur de l'appareil lui-même (TV, box), d'une autre intégration : indiqué dans control_players ou de même nom. */
  _twin(id) {
    const st = this._hass?.states || {}, reg = this._hass?.entities || {};
    if (MEDIA_APPS[reg[id]?.platform] === undefined) return null;
    const map = this._config.control_players && typeof this._config.control_players === "object" ? this._config.control_players : {};
    if (map[id] && st[map[id]]) return map[id];
    const name = normTitle(mediaPlayerName(st[id]?.attributes?.friendly_name));
    if (!name) return null;
    return Object.keys(st).find((x) => x.startsWith("media_player.") && x !== id && !MEDIA_APPS[reg[x]?.platform] && normTitle(st[x].attributes?.friendly_name) === name) || null;
  }

  /** Lecteur Plex/Jellyfin dont l'appareil est éteint ou injoignable : session restée affichée par le serveur. */
  _deviceOff(id) {
    if (this._st(id)?.state === "unavailable") return true;
    const t = this._twin(id);
    const ts = this._st(t);
    if (!ts) return false;
    if (/^(unavailable|standby)$/.test(ts.state)) return true;
    // « off » est ambigu : l'appli Plex ferme sa session Cast au moment de la pause (TV allumée, à la seconde près) ;
    // un « off » arrivé bien après la pause veut dire que la TV a été éteinte
    if (ts.state === "off" && this._st(id)?.state === "paused") {
      const gap = Date.parse(ts.last_changed || "") - Date.parse(this._st(id)?.last_changed || "");
      return Number.isFinite(gap) && gap > 60000;
    }
    return false;
  }

  _controller(id) {
    const st = this._hass?.states || {}, reg = this._hass?.entities || {};
    const feat = (x) => Number(st[x]?.attributes?.supported_features) || 0;
    const can = (x) => st[x] && st[x].state !== "unavailable" && (feat(x) & (MP.PAUSE | MP.PLAY | MP.STOP));
    if (can(id)) return id;
    const map = this._config.control_players && typeof this._config.control_players === "object" ? this._config.control_players : {};
    if (map[id] && can(map[id])) return map[id];
    const norm = (n) => String(n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    const name = norm(mediaPlayerName(st[id]?.attributes?.friendly_name));
    if (!name) return null;
    return Object.keys(st).find((x) => x.startsWith("media_player.") && x !== id && !MEDIA_APPS[reg[x]?.platform] && can(x)
      && norm(st[x].attributes?.friendly_name) === name) || null;
  }

  connectedCallback() {
    clearInterval(this._tick);
    this._tick = setInterval(() => { this._sig = null; this._render(); }, 30000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
  }

  getCardSize() {
    return 5;
  }

  _st(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  /** Serveurs (appareil principal de chaque intégration) et leurs lecteurs (appareils rattachés). */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass;
    const reg = hass.entities || {}, devs = hass.devices || {};
    const servers = {};
    // un serveur = une entrée d'intégration ; les appareils des sessions n'ont pas toujours de lien vers le serveur
    const srvOf = (platform, devId) => {
      const dev = devs[devId];
      const top = dev?.via_device_id && devs[dev.via_device_id] ? dev.via_device_id : devId;
      const entry = dev?.primary_config_entry || dev?.config_entries?.[0] || devs[top]?.primary_config_entry || top || "x";
      const key = `${platform}:${entry}`;
      return (servers[key] ||= { key, platform, dev: null, name: MEDIA_APPS[platform][0], count: null, update: null, libs: [], players: [] });
    };
    const setDev = (s, devId) => {
      if (s.dev || !devs[devId]) return;
      s.dev = devs[devId];
      s.name = s.dev.name_by_user || s.dev.name || s.name;
    };
    for (const [id, e] of Object.entries(reg)) {
      if (!MEDIA_APPS[e.platform] || !hass.states[id] || e.hidden) continue;
      const s = srvOf(e.platform, e.device_id);
      const domain = id.split(".")[0];
      if (domain === "media_player") { s.players.push(id); continue; }
      setDev(s, e.device_id); // l'appareil qui porte les capteurs est le serveur
      if (domain === "update") s.update ||= id;
      else if (domain === "sensor" && /_library_|bibliotheque/.test(id)) s.libs.push(id);
      else if (domain === "sensor") s.count ||= id;
    }
    for (const s of Object.values(servers)) {
      if (!s.dev) { const d = devs[reg[s.players[0]]?.device_id]; const top = d?.via_device_id && devs[d.via_device_id]; if (top) setDev(s, top.id); }
    }
    // lecteurs sans appareil (sessions Jellyfin) : rattachés au serveur s'il est seul pour cette intégration
    for (const [key, s] of Object.entries(servers)) {
      if (s.dev || s.count || s.update || s.libs.length) continue;
      const owners = Object.values(servers).filter((o) => o !== s && o.platform === s.platform && o.dev);
      if (owners.length !== 1) continue;
      owners[0].players.push(...s.players);
      delete servers[key];
    }
    const list = Object.values(servers).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    this._map = { servers: list };
    return this._map;
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const m = this._resolve();
    const ids = m.servers.flatMap((s) => [s.count, s.update, ...s.libs, ...s.players]);
    if (c.show_controls !== false) for (const id of m.servers.flatMap((s) => s.players)) { const k = this._controller(id); if (k && !ids.includes(k)) ids.push(k); }
    for (const id of m.servers.flatMap((s) => s.players)) { const t = this._twin(id); if (t && !ids.includes(t)) ids.push(t); }
    if (c.sleep_timer) ids.push(c.sleep_timer);
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${[...this._open].join(",")}|${Math.floor(Date.now() / 30000)}|` + ids.map((id) => { const o = this._st(id); return o ? `${o.state}|${o.last_changed}|${o.attributes?.media_title}|${o.attributes?.media_position}|${o.attributes?.volume_level}|${o.attributes?.is_volume_muted}|${o.attributes?.finishes_at}` : "-"; }).join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const playing = (id) => /^(playing|paused|buffering)$/.test(this._st(id)?.state || "") && !this._deviceOff(id);
    const clock = (s) => { if (!Number.isFinite(s)) return ""; s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), mn = Math.floor((s % 3600) / 60); return h ? `${h} h ${String(mn).padStart(2, "0")}` : `${mn} min`; };
    // titre affiché : série et épisode, artiste et morceau, ou film
    const titleOf = (a) => {
      const ep = a.media_season && a.media_episode ? ` · S${String(a.media_season).padStart(2, "0")}E${String(a.media_episode).padStart(2, "0")}` : "";
      if (a.media_series_title) return [a.media_series_title, `${a.media_title || ""}${ep}`];
      if (a.media_artist) return [a.media_title || "", [a.media_artist, a.media_album_name].filter(Boolean).join(" · ")];
      return [a.media_title || a.media_content_id || "Lecture", [a.media_library_title, a.media_content_rating].filter(Boolean).join(" · ")];
    };
    // commandes de lecture, selon ce que permet le lecteur qui commande la session
    const controls = (id, pos) => {
      const k = this._controller(id);
      if (!k) return "";
      let f = Number(this._st(k)?.attributes?.supported_features) || 0, kst = this._st(k)?.state;
      // lecteur de l'appareil sans média (ex. Cast fermé par l'appli Plex pendant la pause) : seule la reprise par Plex reste possible
      const lost = k !== id && !["playing", "paused", "buffering"].includes(kst);
      const sf = Number(this._st(id)?.attributes?.supported_features) || 0;
      const plexResume = lost && this._st(id)?.state === "paused" && (sf & MP.PLAY_MEDIA) && this._hass?.entities?.[id]?.platform === "plex";
      if (lost) f = 0;
      const on = kst === "playing" || this._st(id)?.state === "playing";
      const via = k !== id ? mediaPlayerName(this._st(k)?.attributes?.friendly_name) : "";
      const b = (act, icon, label, extra = "") => `<button class="md-b" data-mp="${esc(k)}" data-mp-act="${act}"${extra} title="${esc(label)}${via ? ` (${esc(via)})` : ""}" aria-label="${esc(label)}"><ha-icon icon="${icon}"></ha-icon></button>`;
      const seek = (f & MP.SEEK) && Number.isFinite(pos);
      const resumeBtn = plexResume ? `<button class="md-b" data-mp="${esc(id)}" data-mp-act="plex_resume" title="Reprendre la lecture (par Plex)" aria-label="Reprendre la lecture"><ha-icon icon="mdi:play"></ha-icon></button>` : "";
      const ka = this._st(k)?.attributes || {};
      // volume : coupure, −, niveau, +
      let vol = "";
      if (c.show_volume !== false && (f & (MP.VOLUME_SET | MP.MUTE))) {
        const lv = Number(ka.volume_level), muted = ka.is_volume_muted === true;
        const step = Math.min(50, Math.max(1, Number(c.volume_step) || 5)) / 100;
        const has = (f & MP.VOLUME_SET) && Number.isFinite(lv);
        vol = `<div class="md-v">
            ${f & MP.MUTE ? b("volume_mute", muted ? "mdi:volume-off" : "mdi:volume-high", muted ? "Remettre le son" : "Couper le son", ` data-mute="${!muted}"`) : ""}
            ${has ? `${b("volume_set", "mdi:volume-minus", "Baisser le volume", ` data-vol="${(lv - step).toFixed(2)}"`)}
            <div class="bar ${muted ? "mute" : ""}"><i style="width:${(lv * 100).toFixed(0)}%"></i></div><small>${muted ? "Muet" : `${Math.round(lv * 100)} %`}</small>
            ${b("volume_set", "mdi:volume-plus", "Monter le volume", ` data-vol="${(lv + step).toFixed(2)}"`)}` : ""}
            %EXTRA%</div>`;
      }
      // minuterie de veille (minuteur Home Assistant)
      let sleep = "", sleepBtn = "";
      const t = c.sleep_timer && (!c.sleep_player || c.sleep_player === k || c.sleep_player === id) ? this._st(c.sleep_timer) : null;
      if (t) {
        const left = t.state === "active" ? (Date.parse(t.attributes?.finishes_at || "") - Date.now()) / 60000 : NaN;
        const sk = `sleep:${id}`, sOpen = this._open.has(sk);
        sleepBtn = `<button class="md-b ${t.state === "active" ? "on" : ""}" data-fold="${esc(sk)}" title="Minuterie de veille" aria-label="Minuterie de veille" aria-expanded="${sOpen}"><ha-icon icon="mdi:timer-sand"></ha-icon></button>`;
        const durs = (Array.isArray(c.sleep_durations) ? c.sleep_durations : [15, 30, 45, 60, 90]).map(Number).filter((x) => x > 0);
        sleep = `${t.state === "active" ? `<div class="md-sl"><ha-icon icon="mdi:timer-sand"></ha-icon>Veille dans ${Number.isFinite(left) ? Math.max(1, Math.ceil(left)) : "?"} min</div>` : ""}
          ${sOpen ? `<div class="md-c md-ch">${durs.map((d) => `<button class="md-chip" data-mp="${esc(k)}" data-mp-act="timer_start" data-min="${d}">${d} min</button>`).join("")}
            ${t.state === "active" ? `<button class="md-chip off" data-mp="${esc(k)}" data-mp-act="timer_cancel">Annuler</button>` : ""}</div>` : ""}`;
      }
      // volet Détails
      const dk = `det:${id}`, dOpen = this._open.has(dk);
      const detBtn = c.show_details !== false ? `<button class="md-b ${dOpen ? "on" : ""}" data-fold="${esc(dk)}" title="Détails" aria-label="Détails" aria-expanded="${dOpen}"><ha-icon icon="mdi:information-outline"></ha-icon></button>` : "";
      return `<div class="md-c">
          ${f & MP.PREV ? b("media_previous_track", "mdi:skip-previous", "Précédent") : ""}
          ${seek ? b("media_seek", "mdi:rewind-10", "Reculer de 10 s", ` data-pos="${Math.round(pos - 10)}"`) : ""}
          ${resumeBtn}${f & (MP.PAUSE | MP.PLAY) ? b("media_play_pause", on ? "mdi:pause" : "mdi:play", on ? "Pause" : "Lecture") : ""}
          ${seek ? b("media_seek", "mdi:fast-forward-30", "Avancer de 30 s", ` data-pos="${Math.round(pos + 30)}"`) : ""}
          ${f & MP.NEXT ? b("media_next_track", "mdi:skip-next", "Suivant") : ""}
          ${f & MP.STOP ? b("media_stop", "mdi:stop", "Arrêt") : ""}
        </div>${vol ? vol.replace("%EXTRA%", sleepBtn + detBtn) : sleepBtn || detBtn ? `<div class="md-c">${sleepBtn}${detBtn}</div>` : ""}${sleep}`;
    };
    // volet Détails : ce que fournissent l'intégration et le lecteur de l'appareil
    const details = (id) => {
      if (c.show_details === false || !this._open.has(`det:${id}`)) return "";
      const a = this._st(id)?.attributes || {}, k = this._controller(id), ka = k ? this._st(k)?.attributes || {} : {};
      const rows = [
        ["Résumé", a.media_summary],
        ["Classification", a.media_content_rating],
        ["Bibliothèque", a.media_library_title],
        ["Utilisateur", a.username || a.user],
        ["Lecteur", mediaPlayerName(a.friendly_name)],
        ["Application", ka.app_name],
        ["Commandé par", k && k !== id ? mediaPlayerName(ka.friendly_name) : null],
        ["Volume", Number.isFinite(Number(ka.volume_level)) ? `${Math.round(ka.volume_level * 100)} %${ka.is_volume_muted ? " (muet)" : ""}` : null],
        ["Durée", Number.isFinite(Number(a.media_duration)) ? clock(Number(a.media_duration)) : null],
      ].filter(([, v]) => v !== undefined && v !== null && v !== "");
      return rows.length ? `<dl class="md-d">${rows.map(([n, v]) => `<dt>${esc(n)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : "";
    };
    const session = (id) => {
      const o = this._st(id), a = o.attributes || {};
      const [t1, t2] = titleOf(a);
      const dur = Number(a.media_duration), posAt = Date.parse(a.media_position_updated_at || "");
      let pos = Number(a.media_position);
      if (o.state === "playing" && Number.isFinite(pos) && Number.isFinite(posAt)) pos += (Date.now() - posAt) / 1000;
      const pct = Number.isFinite(dur) && dur > 0 && Number.isFinite(pos) ? Math.min(100, (pos / dur) * 100) : null;
      const who = [a.username || a.user, mediaPlayerName(a.friendly_name)].filter(Boolean).join(" · ");
      const pic = a.entity_picture ? `<img src="${esc(a.entity_picture)}" alt="" loading="lazy">` : `<ha-icon icon="${esc(a.media_content_type === "music" || a.media_artist ? "mdi:music" : "mdi:movie-open-outline")}"></ha-icon>`;
      return `<div class="md-s ${o.state}" data-entity="${esc(id)}">
          <div class="md-art">${pic}</div>
          <div class="md-i"><div class="md-t">${esc(t1)}</div>${t2 ? `<div class="md-t2">${esc(t2)}</div>` : ""}
            <div class="md-w"><ha-icon icon="${esc(o.state === "paused" ? "mdi:pause" : "mdi:play")}"></ha-icon>${esc(who || "Lecteur")}${MEDIA_TYPES[a.media_content_type] ? ` · ${MEDIA_TYPES[a.media_content_type]}` : ""}</div>
            ${pct !== null ? `<div class="md-p"><div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div><small>${clock(pos)} / ${clock(dur)}</small></div>` : ""}
            ${c.show_controls !== false ? controls(id, pos) : ""}${details(id)}</div>
        </div>`;
    };

    let totalPlaying = 0;
    const blocks = m.servers.map((s) => {
      const [app, appIcon, appColor] = MEDIA_APPS[s.platform];
      const now = s.players.filter(playing);
      totalPlaying += now.length;
      const upd = this._st(s.update);
      const needUpd = upd?.state === "on";
      const version = s.dev?.sw_version || upd?.attributes?.installed_version;
      const canBrowse = c.browse !== false && s.players.some((id) => (Number(this._st(id)?.attributes?.supported_features) || 0) & MP.BROWSE);
      const libs = c.show_libraries !== false ? s.libs.map((id) => {
        const o = this._st(id); const n = Number(o?.state);
        const name = String(o?.attributes?.friendly_name || id).replace(/^.*?(library|bibliothèque)\s*-?\s*/i, "") || id;
        if (!Number.isFinite(n)) return "";
        const open = this._br?.srv === s.key && this._br?.lib === name;
        return canBrowse
          ? `<button class="md-lib br ${open ? "on" : ""}" data-br="lib" data-srv="${esc(s.key)}" data-lib="${esc(name)}" aria-expanded="${open}" title="Voir le contenu"><b>${fmt(n, 0)}</b>${esc(name)}</button>`
          : `<span class="md-lib" data-entity="${esc(id)}"><b>${fmt(n, 0)}</b>${esc(name)}</span>`;
      }).filter(Boolean) : [];
      const panel = this._br?.srv === s.key ? this._brPanel(s) : "";
      const isOpen = this._open.has(s.key);
      const known = s.players.filter((id) => !this._deviceOff(id));
      const clients = c.show_clients !== false && s.players.length ? `<button class="md-more" data-fold="${esc(s.key)}"><ha-icon icon="${esc(isOpen ? "mdi:chevron-up" : "mdi:chevron-down")}"></ha-icon>${isOpen ? "Réduire" : `Lecteurs (${known.length} disponible${known.length > 1 ? "s" : ""} sur ${s.players.length})`}</button>
          ${isOpen ? `<div class="md-cl">${s.players.map((id) => { const o = this._st(id); const on = !this._deviceOff(id); return `<span class="omv-svc ${on ? "on" : ""}" data-entity="${esc(id)}"><i></i>${esc(mediaPlayerName(o?.attributes?.friendly_name) || id)}</span>`; }).join("")}</div>` : ""}` : "";
      return `<div class="md-srv">
          <div class="md-h" data-entity="${esc(s.count || s.update || "")}">
            <span class="md-app" style="--app:${appColor}"><ha-icon icon="${esc(appIcon)}"></ha-icon></span>
            <div class="md-hn"><b>${esc(s.name)}</b><small>${esc([app, version ? `v${String(version).split("-")[0]}` : null].filter(Boolean).join(" · "))}</small></div>
            ${needUpd ? `<span class="srv-led upd" data-entity="${esc(s.update)}"><i></i>Mise à jour</span>` : ""}
            <span class="md-n ${now.length ? "on" : ""}">${now.length ? `${now.length} en lecture` : "Rien en lecture"}</span>
          </div>
          ${now.length ? `<div class="md-ss">${now.map(session).join("")}</div>` : ""}
          ${libs.length ? `<div class="md-libs">${libs.join("")}</div>` : ""}
          ${!libs.length && canBrowse ? `<button class="md-more ${this._br?.srv === s.key ? "on" : ""}" data-br="lib" data-srv="${esc(s.key)}" data-lib="" aria-expanded="${this._br?.srv === s.key}"><ha-icon icon="mdi:folder-play-outline"></ha-icon>Bibliothèques</button>` : ""}
          ${panel}
          ${clients}
        </div>`;
    }).join("");

    const body = !m.servers.length
      ? `<div class="empty">Aucun serveur multimédia trouvé<span>Ajoutez l'intégration Plex, Jellyfin ou Emby dans Paramètres › Appareils et services, puis rechargez la page.</span></div>`
      : `<div class="md-list">${blocks}</div>`;
    const leds = m.servers.length ? `<span class="srv-led ${totalPlaying ? "ok" : "na"}"><i></i>${totalPlaying ? `${totalPlaying} en lecture` : "Aucune lecture"}</span>` : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${OMV_STYLE}${MEDIA_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:play-box-multiple")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
          <div><div class="title">${esc(c.title || "Serveurs multimédia")}</div><div class="sub">${m.servers.map((s) => esc(MEDIA_APPS[s.platform][0])).filter((v, i, a) => a.indexOf(v) === i).join(" · ") || "Plex, Jellyfin, Emby"}</div></div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const MEDIA_STYLE = `<style>
.srv-led.upd i { background: #f0a33a; } .srv-led.upd { border-color: #f0a33a; cursor: pointer; }
.md-list { display: grid; gap: 8px; margin: 4px 12px 14px; }
.md-srv { border: 1px solid var(--med-line); border-radius: 14px; padding: 10px 12px; display: grid; gap: 8px; }
.md-h { display: flex; align-items: center; gap: 10px; cursor: pointer; flex-wrap: wrap; }
.md-app { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: color-mix(in srgb, var(--app) 18%, transparent); flex: none; }
.md-app ha-icon { --mdc-icon-size: 22px; color: var(--app); }
.md-hn { display: grid; flex: 1; min-width: 0; } .md-hn b { font-size: .92rem; } .md-hn small { font-size: .72rem; color: var(--med-muted); }
.md-n { font-size: .78rem; color: var(--med-muted); white-space: nowrap; } .md-n.on { color: var(--med-down); font-weight: 700; }
.md-ss { display: grid; gap: 6px; }
.md-s { display: grid; grid-template-columns: 54px 1fr; gap: 10px; padding: 8px; border-radius: 12px; background: var(--med-surface); cursor: pointer; }
.md-art { width: 54px; height: 76px; border-radius: 8px; overflow: hidden; background: var(--med-line); display: grid; place-items: center; }
.md-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.md-art ha-icon { --mdc-icon-size: 26px; color: var(--med-muted); }
.md-i { display: grid; gap: 2px; min-width: 0; align-content: start; }
.md-t { font-weight: 700; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.md-t2 { font-size: .76rem; color: var(--med-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.md-w { display: flex; align-items: center; gap: 4px; font-size: .74rem; color: var(--med-text); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.md-w ha-icon { --mdc-icon-size: 15px; color: var(--med-down); } .md-s.paused .md-w ha-icon { color: #f0a33a; }
.md-p { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; margin-top: 4px; }
.md-p .bar { height: 5px; } .md-p .bar i { background: var(--med-accent, var(--med-blue)); }
.md-p small { font-size: .68rem; color: var(--med-muted); white-space: nowrap; }
.md-c { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.md-b { all: unset; box-sizing: border-box; cursor: pointer; display: inline-grid; place-items: center; width: 34px; height: 30px; border-radius: 9px;
  border: 1px solid var(--med-line); background: var(--med-bg); color: var(--med-text); }
.md-b:hover { border-color: var(--med-accent, var(--med-blue)); color: var(--med-accent, var(--med-blue)); }
.md-b:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); outline-offset: 1px; }
.md-b ha-icon { --mdc-icon-size: 18px; }
.md-b.on { border-color: var(--med-accent, var(--med-blue)); color: var(--med-accent, var(--med-blue)); }
.md-v { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.md-v .bar { flex: 1; min-width: 40px; }
.md-v .bar.mute i { opacity: .35; }
.md-v small { font-size: .68rem; color: var(--med-muted); min-width: 36px; text-align: right; white-space: nowrap; }
.md-sl { display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: .72rem; color: var(--med-accent, var(--med-blue)); }
.md-sl ha-icon { --mdc-icon-size: 14px; }
.md-chip { all: unset; box-sizing: border-box; cursor: pointer; padding: 4px 10px; border-radius: 999px; font-size: .72rem;
  border: 1px solid var(--med-line); background: var(--med-bg); color: var(--med-text); }
.md-chip:hover { border-color: var(--med-accent, var(--med-blue)); }
.md-chip.off { color: var(--t-red, #ee4a4a); }
.md-chip:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); }
.md-d { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; margin: 8px 0 0; font-size: .72rem; }
.md-d dt { color: var(--med-muted); }
.md-d dd { margin: 0; color: var(--med-text); overflow-wrap: anywhere; }
button.md-lib { all: unset; box-sizing: border-box; cursor: pointer; display: grid; justify-items: center; padding: 6px 4px; border-radius: 10px; background: var(--med-surface); font-size: .7rem; color: var(--med-muted); text-align: center; }
.md-lib.br:hover, .md-lib.br.on { outline: 1px solid var(--med-accent, var(--med-blue)); }
.md-lib.br:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); }
.md-chip ha-icon { --mdc-icon-size: 14px; vertical-align: -2px; }
.md-chip.on { border-color: var(--med-accent, var(--med-blue)); color: var(--med-accent, var(--med-blue)); }
.br { border: 1px solid var(--med-line); border-radius: 12px; padding: 8px; display: grid; gap: 8px; }
.br-h { display: flex; align-items: center; gap: 8px; }
.br-h b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.br-h small, .br-pl small { color: var(--med-muted); font-size: .72rem; }
.br-pl { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.br-q { box-sizing: border-box; width: 100%; padding: 7px 10px; border-radius: 9px; border: 1px solid var(--med-line); background: var(--med-bg); color: var(--med-text); font: inherit; font-size: .8rem; }
.br-q:focus { outline: 2px solid var(--med-accent, var(--med-blue)); outline-offset: 0; }
.br-msg { font-size: .75rem; color: var(--med-muted); }
.br-msg.err { color: var(--t-red, #ee4a4a); }
.br-ls { display: grid; gap: 4px; max-height: 360px; overflow-y: auto; }
.br-it { display: flex; align-items: center; gap: 8px; padding: 3px; border-radius: 9px; }
.br-it:hover { background: var(--med-bg); }
.br-th { flex: 0 0 auto; width: 30px; height: 44px; border-radius: 5px; overflow: hidden; display: grid; place-items: center; background: var(--med-bg); color: var(--med-muted); }
.br-th img { width: 100%; height: 100%; object-fit: cover; }
button.br-th { all: unset; box-sizing: border-box; flex: 0 0 auto; width: 30px; height: 44px; border-radius: 5px; overflow: hidden; display: grid; place-items: center; background: var(--med-bg); color: var(--med-muted); cursor: zoom-in; }
button.br-th:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); }
.br-card { display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap; }
.br-big { flex: 0 0 auto; width: 150px; aspect-ratio: 2 / 3; border-radius: 10px; overflow: hidden; background: var(--med-bg); display: grid; place-items: center; color: var(--med-muted); box-shadow: 0 6px 18px rgba(0,0,0,.35); }
.br-big img { width: 100%; height: 100%; object-fit: cover; }
.br-big ha-icon { --mdc-icon-size: 40px; }
.br-ci { flex: 1; min-width: 150px; display: grid; gap: 6px; align-content: start; }
.br-ci b { font-size: 1rem; color: var(--med-text); }
.br-ci small { color: var(--med-muted); font-size: .75rem; }
.br-ca { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.br-go { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; font-size: .8rem; font-weight: 600; background: var(--med-accent, var(--med-blue)); color: var(--text-primary-color, #fff); }
.br-go ha-icon { --mdc-icon-size: 18px; }
.br-go:focus-visible { outline: 2px solid var(--med-text); outline-offset: 2px; }
.br-th ha-icon { --mdc-icon-size: 18px; }
.br-t { flex: 1; min-width: 0; font-size: .8rem; color: var(--med-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
button.br-t { all: unset; flex: 1; min-width: 0; cursor: pointer; display: flex; align-items: center; gap: 2px; font-size: .8rem; color: var(--med-text); }
button.br-t:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); }
button.br-t ha-icon { --mdc-icon-size: 16px; color: var(--med-muted); margin-left: auto; }
.md-libs { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 6px; }
.md-lib { display: grid; justify-items: center; padding: 6px 4px; border-radius: 10px; background: var(--med-surface); font-size: .7rem; color: var(--med-muted); cursor: pointer; text-align: center; }
.md-lib b { font-size: 1rem; color: var(--med-text); }
.md-more { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;
  padding: 6px; border-radius: 10px; border: 1px solid var(--med-line); font-size: .76rem; font-weight: 600; color: var(--med-muted); }
.md-more:hover { color: var(--med-text); border-color: var(--med-accent, var(--med-blue)); } .md-more ha-icon { --mdc-icon-size: 17px; }
.md-cl { display: flex; flex-wrap: wrap; gap: 6px; }
</style>`;

/* ------------------------------------------------------------ carte DNS (AdGuard Home, Pi-hole) */

const DNS_DEFAULTS = {
  title: "",
  icon: "",
  icon_color: "",
  show_stats: true, show_details: true, show_switches: true, show_update: true,
  pause_minutes: [5, 30], // Pi-hole : pauses proposées quand le blocage est actif
  theme: "v2",
};

/** Rôles : clé de traduction (AdGuard Home, Pi-hole API v5 et v6), sinon fin du nom de l'entité (français ou anglais). */
const DNS_ROLES = [
  ["ratio", "sensor", ["dns_queries_blocked_ratio", "percent_ads_blocked", "ads_percentage_today"], /_(taux_de_requetes_dns_bloquees|dns_queries_blocked_ratio|pourcentage_de_publicites_bloquees(_aujourd_hui)?|ads_percentage_blocked(_today)?)$/],
  ["blocked", "sensor", ["dns_queries_blocked", "ads_blocked", "ads_blocked_today"], /_(requetes_dns_bloquees|dns_queries_blocked|publicites_bloquees(_aujourd_hui)?|ads_blocked(_today)?)$/],
  ["queries", "sensor", ["dns_queries", "dns_queries_today"], /_(requetes_dns(_aujourd_hui)?|dns_queries(_today)?)$/],
  ["speed", "sensor", ["average_processing_speed"], /_(vitesse_de_traitement_moyenne|average_processing_speed)$/],
  ["rules", "sensor", ["rules_count"], /_(nombre_de_regles|rules_count)$/],
  ["parental_blocked", "sensor", ["parental_control_blocked"], /_(controle_parental_bloque|parental_control_blocked)$/],
  ["sb_blocked", "sensor", ["safe_browsing_blocked"], /_(navigation_securisee_bloquee|safe_browsing_blocked)$/],
  ["ss_enforced", "sensor", ["safe_searches_enforced"], /_(recherches_securisees_appliquees|safe_searches_enforced)$/],
  ["domains", "sensor", ["domains_being_blocked"], /_(domaines_bloques|domains_blocked|domains_being_blocked)$/],
  ["clients", "sensor", ["unique_clients"], /_(clients_uniques(_dns)?|dns_unique_clients|unique_clients)$/],
  ["seen", "sensor", ["clients_ever_seen"], /_(clients_vus|seen_clients|clients_ever_seen)$/],
  ["cached", "sensor", ["queries_cached"], /_(requetes_dns_en_cache|dns_queries_cached|queries_cached)$/],
  ["forwarded", "sensor", ["queries_forwarded"], /_(requetes_dns_transferees|dns_queries_forwarded|queries_forwarded)$/],
  ["unique_domains", "sensor", ["unique_domains"], /_(domaines_uniques(_dns)?|dns_unique_domains|unique_domains)$/],
  ["status", "binary_sensor", ["status"], /_(statut|status|etat)$/],
  ["protection", "switch", ["protection"], /_protection$/],
  ["filtering", "switch", ["filtering"], /_(filtrage|filtering)$/],
  ["parental", "switch", ["parental"], /_(controle_parental|parental_control)$/],
  ["safe_browsing", "switch", ["safe_browsing"], /_(navigation_securisee|safe_browsing)$/],
  ["safe_search", "switch", ["safe_search"], /_(recherche_securisee|safe_search)$/],
  ["query_log", "switch", ["query_log"], /_(journal_des_requetes|query_log)$/],
];
const DNS_SWITCH = {
  protection: ["mdi:shield-check-outline", "Protection"], blocking: ["mdi:shield-check-outline", "Blocage"],
  filtering: ["mdi:filter-outline", "Filtrage"], parental: ["mdi:human-male-child", "Contrôle parental"],
  safe_browsing: ["mdi:web-check", "Navigation sécurisée"], safe_search: ["mdi:magnify-scan", "Recherche sécurisée"],
  query_log: ["mdi:text-box-search-outline", "Journal des requêtes"],
};
const dnsRole = (id, ent) => {
  const domain = id.split(".")[0];
  const tk = ent?.translation_key || "";
  for (const [role, d, tks] of DNS_ROLES) if (d === domain && tk && tks.includes(tk)) return role;
  for (const [role, d, , re] of DNS_ROLES) if (d === domain && re.test(id)) return role;
  if (domain === "update") return "update";
  // Pi-hole : un seul interrupteur, sans clé de traduction (nom de l'appareil) : le blocage
  if (domain === "switch" && ent?.platform === "pi_hole") return "blocking";
  return null;
};
const DNS_APPS = { adguard: ["AdGuard Home", "mdi:shield-check"], pi_hole: ["Pi-hole", "mdi:pi-hole"] };
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

class ServeurHaDnsCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-dns-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...DNS_DEFAULTS, ...(config || {}) };
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
        const tog = ev.target.closest?.("[data-toggle]");
        if (tog) {
          const id = tog.dataset.toggle;
          const on = this._st(id)?.state === "on";
          // couper la protection ou le blocage : deux clics (le premier arme, le second dans les 5 s confirme)
          if (on && tog.dataset.guard && this._armed !== id) {
            this._armed = id;
            clearTimeout(this._armTimer);
            this._armTimer = setTimeout(() => { this._armed = null; this._sig = null; this._render(); }, 5000);
          } else {
            this._armed = null;
            this._hass?.callService("switch", on ? "turn_off" : "turn_on", { entity_id: id });
          }
          this._sig = null; this._render(); return;
        }
        const pause = ev.target.closest?.("[data-pause]");
        if (pause) {
          const [id, min] = pause.dataset.pause.split("|");
          const m = Number(min);
          this._hass?.callService("pi_hole", "disable", { entity_id: id, duration: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00` });
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
    if (this._hass?.entities !== hass.entities || this._hass?.devices !== hass.devices) this._map = null;
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 7;
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
    return `serveur-ha-dns:${this._config.title || ""}`;
  }

  /** Serveurs AdGuard Home et Pi-hole, un par appareil, avec un nom lisible même si les appareils ont le même. */
  _resolve() {
    if (this._map) return this._map;
    const hass = this._hass, c = this._config;
    const devs = hass.devices || {};
    const byDev = {};
    for (const [id, e] of Object.entries(hass.entities || {})) {
      if (!DNS_APPS[e.platform] || !hass.states[id] || e.hidden) continue;
      const role = dnsRole(id, e);
      if (!role) continue;
      const key = e.device_id || `${e.platform}:${e.config_entry_id || "x"}`;
      const d = (byDev[key] ||= { id: key, app: e.platform, roles: {}, updates: [], ids: [] });
      d.ids.push(id);
      if (role === "update") d.updates.push(id);
      else d.roles[role] ||= id;
    }
    const want = (Array.isArray(c.servers) ? c.servers : c.servers ? [c.servers] : []).map((x) => (typeof x === "object" ? x : { device: x }));
    let list = Object.values(byDev);
    for (const d of list) {
      const dev = devs[d.id] || {};
      d.devName = dev.name_by_user || dev.name || DNS_APPS[d.app][0];
      // partie commune des entités, sans « dns », « adguard », « home », « pi », « hole » : « principal », « secours »…
      const objs = d.ids.map((id) => id.split(".")[1]);
      let pre = objs[0] || "";
      for (const o of objs) while (pre && !o.startsWith(pre)) pre = pre.slice(0, -1);
      d.tag = pre.split("_").filter((w) => w && !/^(dns|adguard|home|pi|hole|pihole|serveur|server)$/.test(w)).join(" ");
    }
    const dup = (d) => list.filter((x) => x.devName === d.devName).length > 1;
    for (const d of list) d.name = dev2name(d);
    function dev2name(d) { return !dup(d) ? d.devName : d.tag ? capital(d.tag) : `${d.devName} ${list.indexOf(d) + 1}`; }
    if (want.length) {
      list = want.map((w) => {
        const d = list.find((x) => x.id === w.device || x.name.toLowerCase() === String(w.device || "").toLowerCase() || x.tag === String(w.device || "").toLowerCase());
        return d ? { ...d, name: w.name || d.name } : null;
      }).filter(Boolean);
    } else list.sort((a, b) => (a.app === b.app ? 0 : a.app === "adguard" ? -1 : 1) || a.name.localeCompare(b.name, "fr"));
    this._map = list;
    return list;
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const list = this._resolve();
    if (this._tab === undefined) { try { this._tab = JSON.parse(localStorage.getItem(this._tabKey()) || "null"); } catch (e) { this._tab = null; } }
    const srv = list.find((d) => d.id === this._tab) || list[0];
    const ids = list.flatMap((d) => [...Object.values(d.roles), ...d.updates]);
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${srv?.id}|${this._armed}|` + ids.map((id) => this._st(id)?.state ?? "-").join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const guardOf = (d) => d.roles.protection || d.roles.blocking;
    const isOn = (d) => {
      const g = guardOf(d);
      if (g) return this._st(g)?.state === "on";
      const s = this._st(d.roles.status)?.state;
      return s === undefined ? null : s === "on";
    };
    const reachable = (d) => [...Object.values(d.roles)].some((id) => { const s = this._st(id)?.state; return s && s !== "unavailable"; });
    const upd = (d) => d.updates.filter((id) => this._st(id)?.state === "on");
    const off = list.filter((d) => isOn(d) === false || !reachable(d));
    const updates = list.filter((d) => upd(d).length);
    const apps = [...new Set(list.map((d) => d.app))];
    const title = c.title || (apps.length === 1 ? DNS_APPS[apps[0]][0] : "Filtrage DNS");
    const icon = c.icon || (apps.length === 1 ? DNS_APPS[apps[0]][1] : "mdi:shield-check");
    const led = (ok, label, id, cls = "") => `<span class="srv-led ${ok ? "ok" : "bad"} ${cls}" data-entity="${esc(id || "")}"><i></i>${label}</span>`;
    const leds = list.length ? [
      led(!off.length, apps.includes("pi_hole") && !apps.includes("adguard") ? "Blocage" : "Protection", guardOf(off[0] || list[0]) || ""),
      updates.length ? `<span class="srv-led upd" data-entity="${esc(upd(updates[0])[0])}"><i></i>Mise à jour</span>` : "",
    ].join("") : "";
    const sub = list.length ? `${list.length} serveur${list.length > 1 ? "s" : ""} · ${off.length ? `${off.length} sans protection` : "protection active"}` : "";

    let body = "";
    if (!srv) {
      body = `<div class="empty">Aucun serveur AdGuard Home ni Pi-hole trouvé<span>Ajoutez l'intégration AdGuard Home ou Pi-hole (Paramètres › Appareils et services), puis rechargez la page.</span></div>`;
    } else {
      const tabs = list.length > 1 ? `<div class="pve-tabs" role="tablist">${list.map((d) => `<button class="pve-tab ${d.id === srv.id ? "on" : ""}" role="tab" aria-selected="${d.id === srv.id}" data-tab="${esc(d.id)}">
          <i class="pve-dot ${isOn(d) === false || !reachable(d) ? "bad" : "ok"}"></i>${esc(d.name)}<small>${this._num(d.roles.ratio) === null ? "" : `${fmt(this._num(d.roles.ratio), 1)} %`}</small>${upd(d).length ? `<ha-icon class="pve-up" icon="mdi:arrow-up-circle"></ha-icon>` : ""}</button>`).join("")}</div>` : "";
      const r = srv.roles;
      const q = this._num(r.queries), b = this._num(r.blocked);
      const ratio = this._num(r.ratio) ?? (q ? (b / q) * 100 : null);
      const speed = this._num(r.speed);
      const on = isOn(srv);
      // anneau : part des requêtes bloquées
      const R = 36, C = 2 * Math.PI * R, p = Math.max(0, Math.min(100, ratio ?? 0));
      const ring = `<svg viewBox="0 0 90 90" class="dns-ring" aria-hidden="true"><circle cx="45" cy="45" r="${R}" class="bg"/><circle cx="45" cy="45" r="${R}" class="fg" stroke-dasharray="${(p / 100) * C} ${C}" transform="rotate(-90 45 45)"/></svg>`;
      const stat = (id, label, v, unit = "") => (v === null ? "" : `<div class="dns-kv" data-entity="${esc(id)}"><span>${label}</span><b>${v}${unit ? `<small> ${unit}</small>` : ""}</b></div>`);
      const hero = c.show_stats === false ? "" : `<div class="dns-hero ${on === false ? "off" : ""}" data-entity="${esc(r.ratio || r.queries || "")}">
          <div class="dns-rw">${ring}<div class="dns-rv"><b>${ratio === null ? "—" : fmt(ratio, ratio < 10 ? 1 : 0)}<small> %</small></b><span>bloqué</span></div></div>
          <div class="dns-hs">
            <div class="dns-state ${on === false ? "bad" : on ? "ok" : ""}"><i></i>${on === false ? (srv.app === "pi_hole" ? "Blocage désactivé" : "Protection désactivée") : on ? (srv.app === "pi_hole" ? "Blocage actif" : "Protection active") : "État inconnu"}</div>
            ${stat(r.queries, "Requêtes", q === null ? null : fmt(q, 0))}
            ${stat(r.blocked, "Bloquées", b === null ? null : fmt(b, 0))}
            ${stat(r.speed, "Temps de réponse", speed === null ? null : fmt(speed, speed < 10 ? 1 : 0), "ms")}
          </div></div>`;

      // détails : ce que chaque application fournit
      const tile = (id, ic, label, v) => (v === null ? "" : `<div class="tile srv-b" data-entity="${esc(id)}"><ha-icon icon="${esc(ic)}"></ha-icon><div class="tile-l">${label}</div><div class="srv-bv">${v}</div></div>`);
      const n = (id) => { const v = this._num(id); return v === null ? null : fmt(v, 0); };
      const det = c.show_details === false ? [] : [
        tile(r.clients, "mdi:devices", "Clients actifs", n(r.clients)),
        tile(r.domains, "mdi:playlist-remove", "Domaines bloqués", n(r.domains)),
        tile(r.rules, "mdi:format-list-checks", "Règles", n(r.rules)),
        tile(r.cached, "mdi:cached", "En cache", n(r.cached)),
        tile(r.forwarded, "mdi:arrow-decision-outline", "Transférées", n(r.forwarded)),
        tile(r.unique_domains, "mdi:web", "Domaines uniques", n(r.unique_domains)),
        tile(r.parental_blocked, "mdi:human-male-child", "Contrôle parental", n(r.parental_blocked)),
        tile(r.sb_blocked, "mdi:web-check", "Navigation sécurisée", n(r.sb_blocked)),
        tile(r.ss_enforced, "mdi:magnify-scan", "Recherches sécurisées", n(r.ss_enforced)),
      ].filter(Boolean);

      // interrupteurs
      const sw = c.show_switches === false ? [] : ["protection", "blocking", "filtering", "parental", "safe_browsing", "safe_search", "query_log"].filter((k) => r[k] && this._st(r[k])).map((k) => {
        const id = r[k], s = this._st(id).state, armed = this._armed === id, guard = k === "protection" || k === "blocking";
        const [ic, label] = DNS_SWITCH[k];
        return `<button class="tile srv-b dns-sw ${s === "on" ? "good" : s === "off" ? "bad" : ""} ${guard ? "main" : ""} ${armed ? "armed" : ""}" data-toggle="${esc(id)}" ${guard ? 'data-guard="1"' : ""} title="${armed ? "Cliquez encore pour couper" : s === "on" ? "Cliquer pour couper" : "Cliquer pour activer"}">
          <ha-icon icon="${esc(armed ? "mdi:check-bold" : ic)}"></ha-icon><div class="tile-l">${label}</div><div class="tile-n">${armed ? "Confirmer ?" : s === "on" ? "Activé" : s === "off" ? "Désactivé" : "Indisponible"}</div></button>`;
      });
      // Pi-hole : pause du blocage
      const pauses = srv.app === "pi_hole" && r.blocking && this._st(r.blocking)?.state === "on" && c.show_switches !== false
        ? (Array.isArray(c.pause_minutes) ? c.pause_minutes : [c.pause_minutes]).filter((m) => Number(m) > 0).map((m) => `<button class="tile srv-b dns-sw dns-pause" data-pause="${esc(r.blocking)}|${Number(m)}" title="Couper le blocage pendant ${Number(m)} min"><ha-icon icon="mdi:timer-pause-outline"></ha-icon><div class="tile-l">Pause</div><div class="tile-n">${Number(m)} min</div></button>`)
        : [];

      // mise à jour
      const ups = c.show_update === false ? [] : srv.updates.map((id) => {
        const u = this._st(id), a = u.attributes || {};
        const label = srv.updates.length > 1 ? (a.title || a.friendly_name || "Mise à jour").replace(/^Pi-?hole\s*/i, "") : DNS_APPS[srv.app][0];
        return `<div class="tile srv-t nas-dsm ${u.state === "on" ? "up" : ""}" data-entity="${esc(id)}"><div class="tile-l"><ha-icon icon="${esc(u.state === "on" ? "mdi:package-up" : "mdi:package-check")}"></ha-icon>${esc(label)}</div>
          <div class="srv-kv"><span>${u.state === "on" ? "Dispo" : "Version"}</span><b class="${u.state === "on" ? "bad" : ""}">${esc((u.state === "on" ? a.latest_version : a.installed_version) || "—")}</b></div>
          <div class="srv-kv"><span>État</span><b class="${u.state === "on" ? "bad" : "ok"}">${u.state === "on" ? "À installer" : "À jour"}</b></div></div>`;
      });

      const sec = (ic, t, inner) => (inner ? `<div class="srv-sec"><div class="srv-h"><ha-icon icon="${esc(ic)}"></ha-icon>${t}</div>${inner}</div>` : "");
      body = tabs + (hero ? `<div class="srv-sec">${hero}</div>` : "")
        + sec("mdi:chart-box-outline", "Détails", det.length ? `<div class="srv-bk dns-det">${det.join("")}</div>` : "")
        + sec("mdi:toggle-switch-outline", "Réglages", sw.length || pauses.length ? `<div class="srv-bk dns-sws">${sw.join("")}${pauses.join("")}</div>` : "")
        + sec("mdi:update", "Mise à jour", ups.length ? `<div class="tiles srv-tiles">${ups.join("")}</div>` : "");
    }

    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${NAS_STYLE}${PVE_STYLE}${DNS_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)} ${off.length ? "srv-alert" : ""}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(icon)}" style="color:${esc(c.icon_color || "var(--med-down)")}"></ha-icon>
          <div><div class="title">${esc(title)}</div><div class="sub">${esc(sub)}</div></div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const DNS_STYLE = `<style>
.dns-hero { display: flex; align-items: center; gap: 16px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--med-line); background: var(--med-surface); cursor: pointer; }
.dns-hero.off { border-color: var(--t-red); }
.dns-rw { position: relative; width: 104px; height: 104px; flex: none; }
.dns-ring { width: 100%; height: 100%; display: block; }
.dns-ring circle { fill: none; stroke-width: 9; }
.dns-ring .bg { stroke: var(--med-line); }
.dns-ring .fg { stroke: var(--med-down); stroke-linecap: round; transition: stroke-dasharray .4s ease; }
.dns-hero.off .dns-ring .fg { stroke: var(--t-red); }
.dns-rv { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.dns-rv b { font-size: 1.4rem; font-weight: 700; line-height: 1.1; }
.dns-rv small { font-size: .75rem; color: var(--med-muted); font-weight: 500; }
.dns-rv span { font-size: .72rem; color: var(--med-muted); }
.dns-hs { flex: 1; min-width: 0; display: grid; gap: 4px; }
.dns-state { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: .9rem; margin-bottom: 2px; }
.dns-state i { width: 8px; height: 8px; border-radius: 50%; background: var(--med-muted); }
.dns-state.ok { color: var(--med-down); } .dns-state.ok i { background: var(--med-down); }
.dns-state.bad { color: var(--t-red); } .dns-state.bad i { background: var(--t-red); }
.dns-kv { display: flex; justify-content: space-between; gap: 8px; font-size: .84rem; color: var(--med-muted); }
.dns-kv b { color: var(--med-text); font-weight: 700; font-size: .95rem; white-space: nowrap; }
.dns-kv small { color: var(--med-muted); font-weight: 500; font-size: .72rem; }
.dns-det { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); }
.dns-sws { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); }
.dns-sw { all: unset; box-sizing: border-box; cursor: pointer; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 6px;
  border-radius: 12px; border: 1px solid var(--med-line); color: inherit; font: inherit; }
.dns-sw:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); }
.dns-sw .tile-l { font-size: .74rem; }
.dns-sw.bad { border-color: var(--med-line); } .dns-sw.bad ha-icon { color: var(--med-muted) !important; }
.dns-sw.main.bad { border-color: var(--t-red); } .dns-sw.main.bad ha-icon, .dns-sw.main.bad .tile-n { color: var(--t-red) !important; }
.dns-sw.armed { border-color: #f0a33a; background: color-mix(in srgb, #f0a33a 16%, transparent); }
.dns-sw.armed ha-icon, .dns-sw.armed .tile-n { color: #f0a33a !important; font-weight: 700; }
.dns-pause ha-icon { color: #f0a33a !important; }
.dns-pause { border-color: color-mix(in srgb, #f0a33a 35%, transparent); }
@container (max-width: 360px) { .dns-hero { flex-direction: column; align-items: stretch; } .dns-rw { margin: 0 auto; } }
</style>`;

/* ------------------------------------------------------------------ style */

/* ------------------------------------------------------------ carte Serveurs Linux (Linux Update Dashboard) */

const LNX_DEFAULTS = {
  title: "Serveurs Linux",
  icon: "mdi:linux",
  show_uptodate: true, // afficher aussi les serveurs à jour
  show_os: true, // système, noyau, uptime
  show_packages: true, // liste des paquets en attente (dépliable)
  show_actions: true, // bouton Mettre à jour (deux clics)
  show_app: true, // mise à jour de Linux Update Dashboard lui-même
  theme: "v2",
};

/** Entités « update » publiées en MQTT par Linux Update Dashboard : un serveur (attribut system) ou l'application. */
const lnxKind = (s) => {
  const a = s?.attributes || {};
  if (a.system && typeof a.system === "object" && "update_count" in a) return "system";
  if ("channel_id" in a && "update_available" in a && !a.system) return "app";
  return null;
};
const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;
/** Durée d'allumage de « uptime -p » (« up 1 week, 5 days, 3 hours ») en version courte : « 12 j 3 h ». */
const upFr = (v) => {
  const txt = String(v ?? "").trim();
  if (!/^up\b/i.test(txt)) return txt && txt !== "—" ? txt : null;
  const n = (re) => Number((re.exec(txt) || [])[1] || 0);
  const d = n(/(\d+)\s*year/) * 365 + n(/(\d+)\s*month/) * 30 + n(/(\d+)\s*week/) * 7 + n(/(\d+)\s*day/), h = n(/(\d+)\s*hour/), m = n(/(\d+)\s*minute/);
  return d ? `${d} ${CURRENT_CARD_LANGUAGE === "en" ? "d" : "j"}${h ? ` ${h} h` : ""}` : h ? `${h} h${m ? ` ${String(m).padStart(2, "0")} min` : ""}` : `${m} min`;
};

class ServeurHaLinuxCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-linux-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...LNX_DEFAULTS, ...(config || {}) };
    this._sig = null;
    this._open = this._open || new Set();
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const fold = ev.target.closest?.("[data-fold]");
        if (fold) {
          ev.stopPropagation();
          const id = fold.dataset.fold;
          if (this._open.has(id)) this._open.delete(id); else this._open.add(id);
          this._sig = null; this._render(); return;
        }
        const inst = ev.target.closest?.("[data-install]");
        if (inst) {
          // Mise à jour d'un serveur : premier clic arme, second clic dans les 5 s confirme
          ev.stopPropagation();
          const id = inst.dataset.install;
          if (this._armed === id) {
            this._armed = null;
            this._hass?.callService("update", "install", { entity_id: id });
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
    return 6;
  }

  /** Serveurs (triés : sécurité, nombre de mises à jour, nom) et entité de l'application. */
  _resolve() {
    const c = this._config, states = this._hass.states || {};
    const given = Array.isArray(c.entities) && c.entities.length ? c.entities : null;
    const exclude = new Set(c.exclude || []);
    const ids = (given || Object.keys(states).filter((id) => id.startsWith("update."))).filter((id) => states[id] && !exclude.has(id));
    const systems = ids.filter((id) => lnxKind(states[id]) === "system").map((id) => ({ id, s: states[id] }));
    if (!given) {
      const n = (x) => Number(x.s.attributes.security_update_count) || 0, u = (x) => Number(x.s.attributes.update_count) || 0;
      systems.sort((a, b) => n(b) - n(a) || u(b) - u(a) ||
        String(a.s.attributes.system.name || a.id).localeCompare(String(b.s.attributes.system.name || b.id), "fr"));
    }
    const app = Object.keys(states).find((id) => id.startsWith("update.") && lnxKind(states[id]) === "app" && !exclude.has(id));
    return { systems, app };
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const { systems, app } = this._resolve();
    const appS = app ? this._hass.states[app] : null;
    const sig = `${c.theme}|${this._hass.themes?.darkMode}|${this._armed}|${[...this._open].join(",")}|${Math.floor(Date.now() / 60000)}|` +
      [...systems.map((x) => x.s), appS].map((s) => (s ? `${s.state}${s.last_updated}` : "-")).join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    const A = (x) => x.s.attributes;
    const off = (x) => x.s.state === "unavailable" || A(x).reachable === false;
    const nUpd = systems.filter((x) => !off(x) && (Number(A(x).update_count) || 0) > 0).length;
    const nSec = systems.filter((x) => (Number(A(x).security_update_count) || 0) > 0).length;
    const nBoot = systems.filter((x) => A(x).needs_reboot === true).length;
    const nOff = systems.filter(off).length;
    const leds = [
      nSec ? `<span class="srv-led bad"><i></i>${plural(nSec, "sécurité", "sécurité")}</span>` : "",
      nBoot ? `<span class="srv-led upd"><i></i>${plural(nBoot, "redémarrage")}</span>` : "",
      nOff ? `<span class="srv-led na"><i></i>${plural(nOff, "injoignable")}</span>` : "",
    ].join("");

    const shown = c.show_uptodate === false ? systems.filter((x) => off(x) || (Number(A(x).update_count) || 0) > 0 || A(x).needs_reboot) : systems;
    const rows = shown.map((x) => {
      const a = A(x), sys = a.system || {};
      const upd = Number(a.update_count) || 0, sec = Number(a.security_update_count) || 0, kept = Number(a.kept_back_update_count) || 0;
      const busy = a.in_progress === true || (a.active_operation && a.active_operation.type);
      const down = off(x);
      const cls = down ? "na" : sec ? "bad" : upd ? "upd" : a.needs_reboot ? "upd" : "ok";
      const icon = down ? "mdi:lan-disconnect" : sec ? "mdi:shield-alert" : upd ? "mdi:package-up" : a.needs_reboot ? "mdi:restart-alert" : "mdi:check-circle";
      const os = c.show_os !== false ? [[sys.os_name, sys.os_version].filter(Boolean).join(" "), sys.kernel ? `noyau ${sys.kernel}` : null,
        upFr(sys.uptime) ? `allumé depuis ${upFr(sys.uptime)}` : null].filter(Boolean).join(" · ") : "";
      const badges = [
        down ? `<span class="lnx-b na">injoignable${sys.last_seen_at ? ` · vu ${esc(relTime(sys.last_seen_at) || "")}` : ""}</span>` : "",
        busy ? `<span class="lnx-b run">mise à jour en cours…</span>` : "",
        !down && upd ? `<span class="lnx-b upd">${plural(upd, "mise à jour", "mises à jour")}</span>` : "",
        sec ? `<span class="lnx-b bad">${plural(sec, "sécurité", "sécurité")}</span>` : "",
        kept ? `<span class="lnx-b">${plural(kept, "retenue")}</span>` : "",
        a.needs_reboot ? `<span class="lnx-b upd">redémarrage requis</span>` : "",
        !down && !upd && !a.needs_reboot && !busy ? `<span class="lnx-b ok">à jour</span>` : "",
      ].join("");
      const canInstall = c.show_actions !== false && !down && !busy && upd > 0 && ((Number(a.supported_features) || 0) & 1);
      const armed = this._armed === x.id;
      const pk = Array.isArray(a.packages) ? a.packages : [];
      const canFold = c.show_packages !== false && pk.length > 0;
      const open = canFold && this._open.has(x.id);
      const list = open ? `<div class="lnx-pk">${pk.slice(0, 40).map((p) => `<div class="lnx-p${p.is_security ? " sec" : ""}">
          ${p.is_security ? `<ha-icon icon="mdi:shield-alert"></ha-icon>` : `<ha-icon icon="mdi:package-variant"></ha-icon>`}
          <b>${esc(p.package_name)}</b><span>${esc(p.current_version || "")}${p.new_version ? ` → ${esc(p.new_version)}` : ""}</span>
          ${p.is_kept_back ? `<em>retenu</em>` : ""}</div>`).join("")}${pk.length > 40 ? `<div class="lnx-more">et ${pk.length - 40} autres</div>` : ""}</div>` : "";
      return `<div class="lnx-s ${cls}">
        <div class="lnx-row" data-entity="${esc(x.id)}">
          <ha-icon class="lnx-i" icon="${esc(icon)}"></ha-icon>
          <div class="lnx-n"><b>${esc(sys.name || x.s.attributes.friendly_name || x.id)}</b>${os ? `<span>${esc(os)}</span>` : ""}</div>
          <div class="lnx-a">
            ${canInstall ? `<button class="pve-btn wide go${armed ? " armed" : ""}" data-install="${esc(x.id)}" title="Installer les mises à jour">
              <ha-icon icon="mdi:download"></ha-icon>${armed ? "Confirmer ?" : "Mettre à jour"}</button>` : ""}
            ${canFold ? `<button class="pve-btn" data-fold="${esc(x.id)}" title="${open ? "Masquer" : "Voir"} les paquets" aria-expanded="${open}">
              <ha-icon icon="${esc(open ? "mdi:chevron-up" : "mdi:chevron-down")}"></ha-icon></button>` : ""}
          </div>
        </div>
        <div class="lnx-bs">${badges}</div>${list}
      </div>`;
    }).join("");

    const appRow = c.show_app !== false && appS && appS.state === "on"
      ? `<div class="srv-sec"><div class="lnx-appu" data-entity="${esc(app)}"><ha-icon icon="mdi:update"></ha-icon>
          <span>Linux Update Dashboard <b>${esc(appS.attributes.installed_version || "")} → ${esc(appS.attributes.latest_version || "")}</b> disponible</span></div></div>` : "";

    const sub = systems.length
      ? [plural(systems.length, "serveur"), nUpd ? `${nUpd} à mettre à jour` : "tout est à jour"].join(" · ")
      : "";
    const body = systems.length
      ? `<div class="srv-sec">${rows ? `<div class="lnx-list">${rows}</div>` : `<div class="lnx-all">Tous les serveurs sont à jour.</div>`}</div>${appRow}`
      : `<div class="empty">Aucun serveur trouvé<span>Cette carte lit les entités <code>update.*</code> publiées en MQTT par
        <b>Linux Update Dashboard</b> (Paramètres → Notifications → MQTT, avec l'option Home Assistant). Indiquez-les dans <code>entities:</code> si besoin.</span></div>`;

    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${PVE_STYLE}${LNX_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)}">
      <header>
        <div class="brand"><ha-icon class="lnx-logo" icon="${esc(c.icon || "mdi:linux")}" style="${c.icon_color ? `color:${esc(c.icon_color)}` : ""}"></ha-icon>
          <div><div class="title">${esc(c.title)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const LNX_STYLE = `<style>
.lnx-logo { --mdc-icon-size: 34px; color: var(--med-green); }
.srv-led.bad i { background: var(--t-red); } .srv-led.bad { border-color: var(--t-red); }
.lnx-list { display: grid; gap: 6px; }
.lnx-s { border-radius: 12px; border: 1px solid var(--med-line); background: var(--med-surface); padding: 8px 10px; }
.lnx-s.upd { border-color: color-mix(in srgb, #f0a33a 55%, var(--med-line)); }
.lnx-s.bad { border-color: color-mix(in srgb, var(--t-red) 60%, var(--med-line)); }
.lnx-s.na { opacity: .7; }
.lnx-row { display: flex; align-items: center; gap: 10px; cursor: pointer; min-width: 0; }
.lnx-i { --mdc-icon-size: 22px; flex: none; color: var(--med-down); }
.lnx-s.upd .lnx-i { color: #f0a33a; } .lnx-s.bad .lnx-i { color: var(--t-red); } .lnx-s.na .lnx-i { color: var(--med-muted); }
.lnx-n { min-width: 0; flex: 1; display: grid; }
.lnx-n b { font-size: .9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lnx-n span { font-size: .72rem; color: var(--med-muted); line-height: 1.35; overflow-wrap: anywhere; }
.lnx-a { display: flex; gap: 6px; flex: none; }
.lnx-bs { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 0 32px; }
.lnx-b { padding: 1px 8px; border-radius: 999px; font-size: .7rem; font-weight: 600; border: 1px solid var(--med-line); color: var(--med-muted); white-space: nowrap; }
.lnx-b.ok { color: var(--med-down); border-color: color-mix(in srgb, var(--med-down) 45%, transparent); }
.lnx-b.upd { color: #f0a33a; border-color: color-mix(in srgb, #f0a33a 50%, transparent); }
.lnx-b.bad { color: #fff; background: var(--t-red); border-color: var(--t-red); }
.lnx-b.run { color: var(--med-accent, var(--med-blue)); border-color: color-mix(in srgb, var(--med-accent, var(--med-blue)) 50%, transparent); }
.lnx-pk { margin: 8px 0 2px 32px; display: grid; gap: 2px; max-height: 260px; overflow-y: auto; }
.lnx-p { display: flex; align-items: center; gap: 6px; font-size: .74rem; min-width: 0; }
.lnx-p ha-icon { --mdc-icon-size: 14px; color: var(--med-muted); flex: none; }
.lnx-p.sec ha-icon { color: var(--t-red); }
.lnx-p b { font-weight: 600; flex: none; max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lnx-p span { color: var(--med-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lnx-p em { font-style: normal; font-size: .66rem; color: #f0a33a; flex: none; }
.lnx-more, .lnx-all { font-size: .76rem; color: var(--med-muted); padding: 4px 0; }
.lnx-appu { display: flex; align-items: center; gap: 8px; font-size: .8rem; padding: 8px 10px; border-radius: 12px; cursor: pointer;
  border: 1px solid color-mix(in srgb, #f0a33a 50%, var(--med-line)); }
.lnx-appu ha-icon { --mdc-icon-size: 18px; color: #f0a33a; }
.lnx-appu b { color: #f0a33a; }
@container (max-width: 380px) { .lnx-bs, .lnx-pk { margin-left: 0; } .pve-btn.wide { padding: 0 8px; } }
</style>`;

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
.brand .bolt { fill: var(--med-accent, var(--med-blue)); }
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
.day:focus-visible { outline: 2px solid var(--med-accent, var(--med-blue)); }

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
.gauge i { display: block; height: 100%; background: linear-gradient(90deg, var(--med-green), var(--med-accent, var(--med-blue))); }
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
  /* accent (icônes, onglets, sélections, contours) : couleur principale du thème ; les bleus porteurs de sens restent bleus */
  --med-accent: var(--primary-color, #1d93e3);
  --med-on-accent: var(--text-primary-color, #fff);
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

/* ------------------------------------------------------------ carte GitHub */

const GH_DEFAULTS = {
  title: "GitHub",
  icon: "mdi:github",
  icon_color: "",
  user: "", // compte ou organisation suivi
  repos: [], // dépôts à suivre (vide = tous les dépôts du compte)
  exclude: [], // dépôts à ignorer
  hide_bots: true, // masquer ce qu'ouvrent les robots (github-actions[bot], dependabot[bot]…)
  exclude_authors: [], // auteurs à masquer
  types: "all", // all, issues ou prs
  refresh: 10, // minutes entre deux lectures (5 au minimum)
  max_items: 50, // éléments affichés au plus
  expanded: true, // dépôts dépliés à l'ouverture
  show_labels: true,
  theme: "v2",
};

/** Lectures partagées entre les cartes d'une même page (même compte, mêmes filtres) : une seule requête. */
const GH_CACHE = {};
const ghSafeColor = (c) => (/^[0-9a-f]{6}$/i.test(String(c || "")) ? `#${c}` : "#8fa0b8");
const ghList = (v) => (Array.isArray(v) ? v : typeof v === "string" && v.trim() ? v.split(",") : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
const ghStore = {
  get(k) { try { return JSON.parse(window.localStorage.getItem(k) || "null"); } catch (e) { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
};

class ServeurHaGithubCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("serveur-ha-github-card-editor");
  }

  static getStubConfig() {
    return { user: "" };
  }

  setConfig(config) {
    this._config = { ...GH_DEFAULTS, ...(config || {}) };
    this._sig = null;
    this._open = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._clicks) {
      this.shadowRoot.addEventListener("click", (this._clicks = (ev) => {
        const fold = ev.target.closest?.("[data-fold]");
        if (fold) {
          ev.stopPropagation();
          const k = fold.dataset.fold;
          if (this._open.has(k)) this._open.delete(k); else this._open.add(k);
          this._sig = null; this._render(); return;
        }
        if (ev.target.closest?.("[data-act=seen]")) {
          ghStore.set(this._seenKey(), Date.now());
          this._sig = null; this._render(); return;
        }
        if (ev.target.closest?.("[data-act=reload]")) { this._load(true); }
      }));
    }
    this._load(false);
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    clearInterval(this._tick);
    // l'âge des éléments et la prochaine lecture sont recalculés chaque minute
    this._tick = setInterval(() => { this._load(false); this._sig = null; this._render(); }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
  }

  getCardSize() {
    return 6;
  }

  _query() {
    const c = this._config, user = String(c.user || "").trim();
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(user)) return null;
    const type = c.types === "issues" ? " is:issue" : c.types === "prs" ? " is:pr" : "";
    return `user:${user} is:open${type} archived:false`;
  }

  _seenKey() {
    return `serveur-ha-github-seen:${String(this._config.user || "").toLowerCase()}`;
  }

  /** Recherche GitHub (sans jeton : 10 recherches par minute et par adresse), gardée `refresh` minutes. */
  async _load(force) {
    const q = this._query();
    if (!q) { this._data = null; this._render(); return; }
    const refresh = Math.max(5, Number(this._config.refresh) || 10) * 60000;
    const key = `serveur-ha-github:${q}`;
    const mem = GH_CACHE[key] || (GH_CACHE[key] = { data: ghStore.get(key), pending: null, until: 0 });
    this._data = mem.data;
    this._render();
    const fresh = mem.data && Date.now() - mem.data.at < refresh;
    if ((fresh && !force) || mem.pending || Date.now() < mem.until) { if (mem.pending) mem.pending.then(() => { this._data = mem.data; this._sig = null; this._render(); }); return; }
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=100`;
    mem.pending = (async () => {
      try {
        const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
        if (r.status === 403 || r.status === 429) {
          const reset = Number(r.headers.get("x-ratelimit-reset")) * 1000;
          mem.until = Number.isFinite(reset) && reset > Date.now() ? reset : Date.now() + 120000;
          mem.error = `Limite de GitHub atteinte : nouvel essai à ${new Date(mem.until).toLocaleTimeString(cardLocale(), { hour: "2-digit", minute: "2-digit" })}.`;
          return;
        }
        if (!r.ok) { mem.error = r.status === 422 ? "Compte GitHub introuvable." : `GitHub a répondu ${r.status}.`; mem.until = Date.now() + 120000; return; }
        const j = await r.json();
        const items = (j.items || []).map((it) => ({
          id: it.id, n: it.number, title: String(it.title || ""), url: String(it.html_url || ""),
          repo: String(it.repository_url || "").split("/").slice(-1)[0], pr: !!it.pull_request, draft: !!it.draft,
          author: it.user?.login || "", comments: Number(it.comments) || 0, created: it.created_at, updated: it.updated_at,
          labels: (it.labels || []).map((l) => ({ name: String(l.name || ""), color: l.color })),
        }));
        mem.data = { at: Date.now(), total: Number(j.total_count) || items.length, items };
        mem.error = null;
        ghStore.set(key, mem.data);
        // première lecture : rien n'est « nouveau » jusqu'à la suivante
        if (ghStore.get(this._seenKey()) === null) ghStore.set(this._seenKey(), Date.now());
      } catch (e) {
        mem.error = "GitHub injoignable.";
        mem.until = Date.now() + 120000;
      } finally {
        mem.pending = null;
      }
    })();
    await mem.pending;
    this._data = mem.data;
    this._error = mem.error;
    this._sig = null;
    this._render();
  }

  _render() {
    if (!this._config || !this.shadowRoot) return;
    const c = this._config, q = this._query();
    const key = q ? `serveur-ha-github:${q}` : "";
    const err = q ? GH_CACHE[key]?.error : null;
    const d = this._data;
    const seen = Number(ghStore.get(this._seenKey())) || 0;
    const sig = `${c.theme}|${this._hass?.themes?.darkMode}|${d?.at}|${err}|${seen}|${[...(this._open || [])].join(",")}|${Math.floor(Date.now() / 60000)}`;
    if (sig === this._sig) return;
    this._sig = sig;

    const only = ghList(c.repos), skip = ghList(c.exclude), authors = ghList(c.exclude_authors);
    const hidden = (it) => (c.hide_bots !== false && /\[bot\]$/i.test(it.author)) || authors.includes(it.author.toLowerCase());
    const items = (d?.items || []).filter((it) => (!only.length || only.includes(it.repo.toLowerCase())) && !skip.includes(it.repo.toLowerCase()) && !hidden(it))
      .slice(0, Math.max(1, Number(c.max_items) || 50));
    const isNew = (it) => seen && new Date(it.created).getTime() > seen;
    const repos = [...new Set(items.map((it) => it.repo))]
      .map((r) => ({ name: r, list: items.filter((it) => it.repo === r) }))
      .sort((a, b) => b.list.some(isNew) - a.list.some(isNew) || new Date(b.list[0].updated) - new Date(a.list[0].updated));
    if (!this._open) this._open = new Set(c.expanded ? repos.map((r) => r.name) : repos.filter((r) => r.list.some(isNew)).map((r) => r.name));
    const nIssues = items.filter((it) => !it.pr).length, nPr = items.length - nIssues, nNew = items.filter(isNew).length;
    const ago = (iso) => { const s = since(iso); return s ? `il y a ${s}` : ""; };

    const row = (it) => {
      const icon = it.pr ? "mdi:source-pull" : "mdi:alert-circle-outline";
      const labels = c.show_labels ? it.labels.slice(0, 3).map((l) => `<span class="gh-l" style="--lc:${ghSafeColor(l.color)}">${esc(l.name)}</span>`).join("") : "";
      return `<a class="gh-i ${it.pr ? "pr" : "is"}${isNew(it) ? " new" : ""}${it.draft ? " draft" : ""}" href="${esc(/^https:\/\/github\.com\//.test(it.url) ? it.url : "#")}" target="_blank" rel="noopener noreferrer" title="${esc(it.title)}">
        <ha-icon icon="${icon}"></ha-icon>
        <div class="gh-t"><span>${isNew(it) ? '<b class="gh-new">nouveau</b>' : ""}${esc(it.title)}</span>
          <small>#${it.n}${it.draft ? " · brouillon" : ""} · ${esc(it.author)} · ${esc(ago(it.created))}${it.updated !== it.created ? ` · activité ${esc(ago(it.updated))}` : ""}</small>
          ${labels ? `<div class="gh-ls">${labels}</div>` : ""}</div>
        ${it.comments ? `<span class="gh-c" title="${it.comments} commentaire${it.comments > 1 ? "s" : ""}"><ha-icon icon="mdi:comment-outline"></ha-icon>${it.comments}</span>` : ""}
      </a>`;
    };
    const groups = repos.map((r) => {
      const open = this._open.has(r.name), nn = r.list.filter(isNew).length;
      const dots = r.list.map((it) => `<i class="${it.pr ? "pr" : "is"}${isNew(it) ? " new" : ""}"></i>`).join("");
      return `<div class="ping-g ${open ? "open" : ""}">
        <button class="ping-gh" data-fold="${esc(r.name)}" aria-expanded="${open}"><ha-icon icon="mdi:source-repository"></ha-icon><span class="ping-gl">${esc(r.name)}</span>
          <span class="ping-dots gh-dots">${dots}</span>${nn ? `<b class="gh-nb">${nn} nouv.</b>` : ""}<b>${r.list.length}</b><ha-icon class="ping-chev" icon="${open ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon></button>
        ${open ? `<div class="gh-list">${r.list.map(row).join("")}</div>` : ""}
      </div>`;
    }).join("");

    const user = String(c.user || "").trim();
    let body;
    if (!q) body = `<div class="empty">Compte GitHub à indiquer<span>Choisissez le compte ou l'organisation à suivre dans l'éditeur (option <code>user</code>), par exemple <code>user: Marlboro62</code>.</span></div>`;
    else if (!d) body = `<div class="empty">${err ? esc(err) : "Lecture de GitHub…"}</div>`;
    else {
      body = `<div class="ping-sum">
          <div class="${nIssues ? "warn" : "ok"}"><b>${nIssues}</b><span>issue${nIssues > 1 ? "s" : ""} ouverte${nIssues > 1 ? "s" : ""}</span></div>
          <div class="${nPr ? "warn" : "ok"}"><b>${nPr}</b><span>PR ouverte${nPr > 1 ? "s" : ""}</span></div>
          <div class="${nNew ? "bad" : ""}"><b>${nNew}</b><span>nouvelle${nNew > 1 ? "s" : ""}</span></div>
          <div><b>${repos.length}</b><span>dépôt${repos.length > 1 ? "s" : ""}</span></div>
        </div>
        ${items.length ? `<div class="srv-sec ping-groups">${groups}</div>` : `<div class="empty gh-ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon>Rien d'ouvert : tout est traité.</div>`}
        <div class="gh-f"><span>${err ? `${esc(err)} · ` : ""}Lu ${Date.now() - d.at < 60000 ? "à l'instant" : esc(ago(new Date(d.at).toISOString()))}</span>
          <span>${nNew ? `<button data-act="seen">Tout marquer comme vu</button>` : ""}<button data-act="reload" title="Relire maintenant">Actualiser</button></span></div>`;
    }
    const leds = d ? `<span class="srv-led ${nNew ? "bad" : items.length ? "upd" : "ok"}"><i></i>${nNew ? `${nNew} nouvelle${nNew > 1 ? "s" : ""}` : items.length ? `${items.length} ouverte${items.length > 1 ? "s" : ""}` : "Tout est traité"}</span>` : "";
    this.shadowRoot.innerHTML = `${STYLE}${SRV_STYLE}${PVE_STYLE}${PING_STYLE}${GH_STYLE}<ha-card style="${zoomOf(c)}" class="${themeClass(c.theme, this._hass)}">
      <header>
        <div class="brand"><ha-icon class="srv-icon" icon="${esc(c.icon || "mdi:github")}" style="color:${esc(c.icon_color || "var(--med-accent, var(--med-blue))")}"></ha-icon>
          <div><div class="title">${esc(c.title || "GitHub")}</div><div class="sub">${user ? `<a href="https://github.com/${esc(user)}" target="_blank" rel="noopener noreferrer">${esc(user)}</a>` : "Issues et pull requests"}</div></div></div>
        ${leds ? `<div class="srv-leds">${leds}</div>` : ""}
      </header>
      ${body}
    </ha-card>`;
  }
}

const GH_STYLE = `<style>
.sub a { color: inherit; text-decoration: none; } .sub a:hover { text-decoration: underline; }
.gh-dots i { background: #3fb950; } .gh-dots i.pr { background: #a371f7; } .gh-dots i.new { box-shadow: 0 0 0 2px var(--t-red); }
.gh-nb { color: var(--t-red); }
.gh-list { display: grid; gap: 6px; padding: 0 8px 8px; }
.gh-i { display: grid; grid-template-columns: 20px 1fr auto; align-items: start; gap: 9px; padding: 8px 10px; border-radius: 10px; text-decoration: none; color: inherit;
  border: 1px solid var(--med-line); background: var(--med-surface); min-width: 0; }
.gh-i:hover { border-color: var(--med-accent, var(--med-blue)); }
.gh-i > ha-icon { --mdc-icon-size: 18px; color: #3fb950; margin-top: 1px; }
.gh-i.pr > ha-icon { color: #a371f7; } .gh-i.draft > ha-icon { color: var(--med-muted); }
.gh-i.new { border-color: color-mix(in srgb, var(--t-red) 55%, transparent); }
.gh-t { display: grid; gap: 2px; min-width: 0; }
.gh-t > span { font-size: .8rem; font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.gh-t small { font-size: .68rem; color: var(--med-muted); }
.gh-new { display: inline-block; margin-right: 6px; padding: 0 6px; border-radius: 999px; font-size: .62rem; text-transform: uppercase; letter-spacing: .03em; background: var(--t-red); color: #fff; vertical-align: 1px; }
.gh-ls { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
.gh-l { font-size: .62rem; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--lc); color: var(--lc); background: color-mix(in srgb, var(--lc) 14%, transparent); }
.gh-c { display: inline-flex; align-items: center; gap: 3px; font-size: .72rem; color: var(--med-muted); white-space: nowrap; } .gh-c ha-icon { --mdc-icon-size: 14px; }
.gh-ok { flex-direction: row; align-items: center; color: var(--med-down); } .gh-ok ha-icon { --mdc-icon-size: 20px; }
.gh-f { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; padding: 4px 12px 12px; font-size: .7rem; color: var(--med-muted); }
.gh-f button { font: inherit; font-size: .72rem; color: var(--med-text); background: var(--med-surface); border: 1px solid var(--med-line); border-radius: 999px; padding: 4px 10px; cursor: pointer; margin-left: 6px; }
.gh-f button:hover { border-color: var(--med-accent, var(--med-blue)); }
</style>`;

/* ----------------------------------------------------------------- éditeur */

/* English labels for the visual editor, grouped by card.  The French label
 * dictionaries are left intact for backwards compatibility. */
const EN_EDITOR_COMMON = {
  title: "Title", subtitle: "Subtitle", icon: "Icon", icon_color: "Icon color",
  theme: "Card color theme", text_size: "Text size (100% = normal)",
  net_max: "Network traffic bar maximum", ups_device: "UPS (NUT device, optional)",
  ups_name: "UPS name (optional)", navigation_path: "Page opened when clicking the title (optional)",
  show_info: "Information section", show_resources: "Resources section",
  show_network: "Network traffic section", show_actions: "Actions section",
  show_ups: "UPS section (NUT)", show_system: "System section",
  show_apps: "Applications section", show_thermal: "Temperatures and cooling section",
  show_storage: "Storage section", show_details: "Details section",
  show_clients: "Connected clients section", expanded: "Expanded by default",
};
const EN_EDITOR_LABELS = {
  SRV: {
    title: "Title (e.g. Raspberry Pi 4 4 GB)",
    icon: "Header icon (e.g. mdi:raspberry-pi)", icon_color: "Icon color (e.g. #E30B5D)",
    fan: "Fan: fan.* entity or RPM / percent sensor (optional)",
    ram_total: "Total RAM used for the Free RAM bar (optional)",
    backup_title: "Backup section title (optional)",
    temp_warn: "Temperature: warning threshold", temp_alert: "Temperature: critical threshold",
    show_power: "Power supply section", show_backup: "Backups section",
  },
  MAJ: {
    database: "Database size (optional; otherwise detected automatically)",
    ssl: "SSL certificate expiry (optional; otherwise detected automatically)",
    ssl_warn: "SSL certificate warning below (days)",
    ssl_alert: "SSL certificate critical below (days)",
    include_hacs: "Include HACS updates in applications",
    include_devices: "Include device firmware updates (Zigbee, ESPHome…)",
    updates_first: "Show applications with pending updates first",
    show_system: "System updates section",
  },
  NAS: {
    device: "NAS (Synology DSM device, optional)",
    title: "Title (defaults to the device name)",
    tracker: "NAS network tracker used for the IP address (optional)",
    ip: "NAS IP address, or entity providing it (empty = tracker or Synology DSM integration address)",
    volume_name: "Volume 1 name (e.g. HDD 4 TB)",
    fan: "Fan mode (select entity, optional)",
    shutdown: "NAS shutdown button (empty = Synology DSM Stop button)",
    power_on: "NAS power on: Wake on LAN, smart plug or script (empty = detected Wake on LAN)",
    actions: "Additional switches and buttons (smart plugs, mini-PCs…)",
    usb: "USB disks: percent used sensors (empty = auto-detect from Synology DSM)",
    show_ups: "UPS section",
  },
  PVE: {
    nodes: "Visible nodes (empty = all)",
    protect: "Protected guests: disable stop and restart (empty = detected Home Assistant VM)",
    sort: "Guest sorting", hide_stopped: "Hide stopped guests",
    show_node: "Node section", show_storage: "Storage section", show_guests: "Guests section",
    show_actions: "Start, stop and restart buttons (two-click confirmation)",
  },
  OMV: {
    device: "OpenMediaVault integration device (optional)", title: "Title (defaults to OpenMediaVault)",
    ip: "Displayed IP address (empty = integration address)",
    power_on: "Power on when OMV is off: Wake on LAN, smart plug or script (optional)",
    show_system: "System section (uptime, version, load, CPU, RAM)",
    show_storage: "File systems section", show_disks: "Disks section (temperature, SMART)",
    show_services: "Services section (NFS, SMB, SSH…)",
    show_actions: "Restart, standby and power-off buttons (two-click confirmation)",
  },
  ASUS: {
    device: "Router (AsusRouter integration device, optional)",
    title: "Title (defaults to router model)",
    ip: "Displayed IP address (empty = router address)",
    wan_max: "Internet traffic bar maximum (subscription speed)",
    wifi_max: "Wi-Fi and wired traffic bar maximum",
    latest: "Recent connections shown (0 = none)",
    show_system: "System section (uptime, firmware, load, CPU, RAM, temperatures)",
    show_internet: "Internet section (connection, public IP, traffic)",
    show_wifi: "Wi-Fi section (bands, guest networks, traffic)",
    show_ports: "Ethernet ports section", show_clients: "Connected devices section",
    show_vpn: "VPN and parental controls section",
    show_actions: "Restart, Wi-Fi and LED buttons (two-click confirmation)",
  },
  PING: {
    group_by: "Group devices by", expanded: "Expand groups on opening",
    standby: "Intentionally turned-off devices (gray Off instead of red)",
    standby_groups: "Groups that are intentionally powered off",
    warn_ms: "Latency warning above (ms)", alert_ms: "Latency critical above (ms)",
  },
  ZB: {
    source: "Monitored devices", include_phones: "Include phones and tablets (Companion App)",
    warn: "Low battery warning below (%)", alert: "Replace battery below (%)",
    lqi_warn: "Low Zigbee link quality below (0–255)",
    silent_hours: "Device considered silent after (hours)",
    exclude: "Entities or devices to ignore",
    expanded: "Expand Healthy batteries and Mains-powered groups by default",
  },
  WG: {
    expanded: "Expand servers by default",
    show_endpoint: "Show peer public endpoints (otherwise tooltip only)",
    names: "Peer display names (YAML: original name: new name)",
  },
  GL: {
    expanded: "Expand servers by default",
    temp_warn: "Temperature warning above", temp_alert: "Temperature critical above",
  },
  MEDIA: {
    show_libraries: "Show libraries (enable sensors in the integration)",
    show_clients: "Known media players list (expandable)",
    show_controls: "Playback controls (pause, stop, skip…)",
    show_volume: "Volume and mute control", volume_step: "Volume step",
    sleep_timer: "Sleep timer duration (minutes)",
    sleep_player: "Player for the sleep timer (empty = all)",
    show_details: "Details button",
    browse: "Click a library to browse contents and start playback",
    browse_player: "Default player for playback",
    control_players: "Device control player (YAML: Plex player: TV player); otherwise match by name",
  },
  DNS: {
    title: "Title (empty = AdGuard Home, Pi-hole or DNS Filtering)",
    servers: "Visible servers in order (empty = all)",
    show_stats: "Queries and blocked share", show_details: "Details section",
    show_switches: "Settings section (switches, Pi-hole pause)",
    show_update: "Updates section",
  },
  LNX: {
    entities: "Visible servers in order (empty = all, auto-detected)",
    show_uptodate: "Show up-to-date servers too",
    show_os: "Operating system, kernel and uptime",
    show_packages: "Pending packages list (expandable)",
    show_actions: "Update button (two-click confirmation)",
    show_app: "Linux Update Dashboard update status",
  },
  GH: {
    user: "GitHub account or organization to monitor", types: "Displayed item types",
    exclude: "Repositories to ignore", repos: "Repositories to watch (empty = all)",
    hide_bots: "Hide items opened by bots (github-actions, dependabot…)",
    exclude_authors: "Authors to ignore", refresh: "Check GitHub every (minutes, minimum 5)",
    max_items: "Maximum displayed items", expanded: "Expand repositories by default",
    show_labels: "Labels (bug, feature request…)",
  },
};
const LANGUAGE_SELECT = {
  name: "language",
  selector: { select: { mode: "dropdown", options: [
    { value: "auto", label: "Automatique (langue de Home Assistant)" },
    { value: "fr", label: "Français" },
    { value: "en", label: "Anglais" },
    { value: "pl", label: "Polonais" },
  ] } },
};
const languageSchema = (schema, lang) => [
  ...schema.map((item) => item.selector?.select?.options && lang !== "fr"
    ? { ...item, selector: { select: { ...item.selector.select, options: item.selector.select.options.map((option) => ({
      ...option, label: translateByLanguage(option.label, lang)
    })) } } } : item),
  { ...LANGUAGE_SELECT, selector: { select: { mode: "dropdown", options: lang === "en" ? [
    { value: "auto", label: "Automatic (Home Assistant language)" },
    { value: "fr", label: "French" },
    { value: "en", label: "English" },
    { value: "pl", label: "Polish" },
  ] : lang === "pl" ? [
    { value: "auto", label: "Automatycznie (język Home Assistant)" },
    { value: "fr", label: "Francuski" },
    { value: "en", label: "Angielski" },
    { value: "pl", label: "Polski" },
  ] : LANGUAGE_SELECT.selector.select.options } } }
];

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

/** Taille du texte, commune à toutes les cartes. */
const TEXT_SIZE = { name: "text_size", selector: { number: { min: 70, max: 200, step: 5, mode: "slider", unit_of_measurement: "%" } } };
const COMMON_LABELS = { text_size: "Taille du texte (100 % = normal)" };

/** Éditeur visuel : formulaire Home Assistant construit à partir du schéma. */
function makeEditor(schema, labels, defaults, englishLabels = {}, polishLabels = {}) {
  const hasDays = schema.some((s) => s.name === "days");
  return class extends HTMLElement {
    setConfig(config) {
      this._config = { ...config };
      this._draw();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._form || this._editorLanguage !== cardLanguage(this._config, hass)) this._draw();
      else this._form.hass = hass;
    }

    _draw() {
      if (!this._hass || !this._config) return;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (field) => {
          const lang = cardLanguage(this._config, this._hass);
          if (field.name === "language") return lang === "en" ? "Language" : lang === "pl" ? "Język" : "Langue";
          if (lang === "en") return englishLabels[field.name] || EN_EDITOR_COMMON[field.name] || translateEnglish(labels[field.name] || COMMON_LABELS[field.name] || field.name);
          if (lang === "pl") return polishLabels[field.name] || PL_EDITOR_COMMON[field.name] || translatePolish(labels[field.name] || COMMON_LABELS[field.name] || field.name);
          return labels[field.name] || COMMON_LABELS[field.name] || field.name;
        };
        this._form.addEventListener("value-changed", (ev) => {
          const v = { ...ev.detail.value };
          if (hasDays && v.days !== undefined) v.days = Number(v.days);
          this._config = v;
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: v }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      const lang = cardLanguage(this._config, this._hass);
      if (this._editorLanguage !== lang) {
        this._editorLanguage = lang;
        this._form.schema = languageSchema(schema, lang);
      }
      this._form.data = hasDays
        ? { ...defaults, ...this._config, language: this._config.language || "auto", days: String(this._config.days || defaults.days) }
        : { ...defaults, ...this._config, language: this._config.language || "auto" };
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
  TEXT_SIZE,
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
const ServeurHaCardEditor = makeEditor(SRV_SCHEMA, SRV_LABELS, SRV_DEFAULTS, EN_EDITOR_LABELS.SRV, PL_EDITOR_LABELS.SRV);
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
  TEXT_SIZE,
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
const ServeurHaMajCardEditor = makeEditor(MAJ_SCHEMA, MAJ_LABELS, MAJ_DEFAULTS, EN_EDITOR_LABELS.MAJ, PL_EDITOR_LABELS.MAJ);
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
  TEXT_SIZE,
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
const ServeurHaNasCardEditor = makeEditor(NAS_SCHEMA, NAS_LABELS, NAS_DEFAULTS, EN_EDITOR_LABELS.NAS, PL_EDITOR_LABELS.NAS);
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
  { name: "show_ups", selector: { boolean: {} } },
  { name: "ups_device", selector: { device: { integration: "nut" } } },
  { name: "ups_name", selector: { text: {} } },
  THEME_SELECT,
  TEXT_SIZE,
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
  show_ups: "Section Onduleur (NUT)",
  ups_device: "Onduleur (appareil NUT, facultatif)",
  ups_name: "Nom de l'onduleur (facultatif)",
  theme: "Couleurs de la carte",
};
const ServeurHaProxmoxCardEditor = makeEditor(PVE_SCHEMA, PVE_LABELS, PVE_DEFAULTS, EN_EDITOR_LABELS.PVE, PL_EDITOR_LABELS.PVE);
const OMV_SCHEMA = [
  { name: "device", selector: { device: { integration: "omv" } } },
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "ip", selector: { text: {} } },
  { name: "power_on", selector: { entity: { domain: ["button", "switch", "script", "input_boolean"] } } },
  { name: "net_max", selector: { number: { min: 1, max: 100000, mode: "box", unit_of_measurement: "Mbit/s" } } },
  { name: "show_system", selector: { boolean: {} } },
  { name: "show_storage", selector: { boolean: {} } },
  { name: "show_disks", selector: { boolean: {} } },
  { name: "show_services", selector: { boolean: {} } },
  { name: "show_network", selector: { boolean: {} } },
  { name: "show_actions", selector: { boolean: {} } },
  { name: "show_ups", selector: { boolean: {} } },
  { name: "ups_device", selector: { device: { integration: "nut" } } },
  { name: "ups_name", selector: { text: {} } },
  THEME_SELECT,
  TEXT_SIZE,
];
const OMV_LABELS = {
  device: "OpenMediaVault (appareil de l'intégration, facultatif)",
  title: "Titre (OpenMediaVault par défaut)",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  ip: "Adresse IP affichée (vide = adresse de l'intégration)",
  power_on: "Allumage quand OMV est éteint : Wake on LAN, prise ou script (facultatif)",
  net_max: "Pleine échelle des barres réseau",
  show_system: "Section Système (uptime, version, charge, CPU, RAM)",
  show_storage: "Section Systèmes de fichiers",
  show_disks: "Section Disques (température, SMART)",
  show_services: "Section Services (NFS, SMB, SSH…)",
  show_network: "Section Débits réseau",
  show_actions: "Boutons redémarrer, veille, éteindre (deux clics)",
  show_ups: "Section Onduleur (NUT)",
  ups_device: "Onduleur (appareil NUT, facultatif)",
  ups_name: "Nom de l'onduleur (facultatif)",
  theme: "Couleurs de la carte",
};
const ServeurHaOmvCardEditor = makeEditor(OMV_SCHEMA, OMV_LABELS, OMV_DEFAULTS, EN_EDITOR_LABELS.OMV, PL_EDITOR_LABELS.OMV);
const ASUS_SCHEMA = [
  { name: "device", selector: { device: { integration: "asusrouter" } } },
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "ip", selector: { text: {} } },
  { name: "wan_max", selector: { number: { min: 1, max: 100000, mode: "box", unit_of_measurement: "Mbit/s" } } },
  { name: "wifi_max", selector: { number: { min: 1, max: 100000, mode: "box", unit_of_measurement: "Mbit/s" } } },
  { name: "latest", selector: { number: { min: 0, max: 20, mode: "box" } } },
  { name: "show_system", selector: { boolean: {} } },
  { name: "show_internet", selector: { boolean: {} } },
  { name: "show_wifi", selector: { boolean: {} } },
  { name: "show_ports", selector: { boolean: {} } },
  { name: "show_clients", selector: { boolean: {} } },
  { name: "show_vpn", selector: { boolean: {} } },
  { name: "show_actions", selector: { boolean: {} } },
  THEME_SELECT,
  TEXT_SIZE,
];
const ASUS_LABELS = {
  device: "Routeur (appareil AsusRouter, facultatif)",
  title: "Titre (modèle du routeur par défaut)",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  ip: "Adresse IP affichée (vide = adresse du routeur)",
  wan_max: "Pleine échelle des barres Internet (débit de l'abonnement)",
  wifi_max: "Pleine échelle des barres Wi-Fi et filaire",
  latest: "Dernières connexions affichées (0 = aucune)",
  show_system: "Section Système (uptime, firmware, charge, CPU, RAM, températures)",
  show_internet: "Section Internet (connexion, IP publique, débits)",
  show_wifi: "Section Wi-Fi (bandes, réseaux invités, débits)",
  show_ports: "Section Ports Ethernet",
  show_clients: "Section Appareils connectés",
  show_vpn: "Section VPN et contrôle parental",
  show_actions: "Boutons redémarrer, Wi-Fi, LED (deux clics)",
  theme: "Couleurs de la carte",
};
const ServeurHaAsusCardEditor = makeEditor(ASUS_SCHEMA, ASUS_LABELS, ASUS_DEFAULTS, EN_EDITOR_LABELS.ASUS, PL_EDITOR_LABELS.ASUS);
const PING_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  {
    name: "group_by",
    selector: { select: { mode: "dropdown", options: [
      { value: "auto", label: "Par type d'appareil (d'après le nom)" },
      { value: "area", label: "Par pièce" },
      { value: "none", label: "Une seule liste" },
    ] } },
  },
  { name: "expanded", selector: { boolean: {} } },
  { name: "standby", selector: { entity: { multiple: true, filter: { integration: "ping", domain: ["binary_sensor", "device_tracker"] } } } },
  {
    name: "standby_groups",
    selector: { select: { multiple: true, mode: "list", options: [
      { value: "net", label: "Réseau" }, { value: "srv", label: "Serveurs" }, { value: "print", label: "Imprimantes" },
      { value: "media", label: "Multimédia" }, { value: "mobile", label: "Téléphones et ordinateurs" }, { value: "home", label: "Domotique" },
    ] } },
  },
  { name: "warn_ms", selector: { number: { min: 1, max: 1000, mode: "box", unit_of_measurement: "ms" } } },
  { name: "alert_ms", selector: { number: { min: 1, max: 5000, mode: "box", unit_of_measurement: "ms" } } },
  THEME_SELECT,
  TEXT_SIZE,
];
const PING_LABELS = {
  title: "Titre",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  group_by: "Regroupement des appareils",
  expanded: "Groupes dépliés à l'ouverture",
  standby: "Appareils éteints volontairement (gris « Éteint » au lieu de rouge)",
  standby_groups: "Groupes entiers éteints volontairement",
  warn_ms: "Latence orange à partir de",
  alert_ms: "Latence rouge à partir de",
  theme: "Couleurs de la carte",
};
const ServeurHaPingCardEditor = makeEditor(PING_SCHEMA, PING_LABELS, PING_DEFAULTS, EN_EDITOR_LABELS.PING, PL_EDITOR_LABELS.PING);
const ZB_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "source", selector: { select: { mode: "dropdown", options: [
    { value: "all", label: "Tous les appareils à pile, et les appareils Zigbee" },
    { value: "zigbee", label: "Appareils Zigbee seulement (Zigbee2MQTT, ZHA)" },
  ] } } },
  { name: "include_phones", selector: { boolean: {} } },
  { name: "warn", selector: { number: { min: 5, max: 80, mode: "box", unit_of_measurement: "%" } } },
  { name: "alert", selector: { number: { min: 1, max: 50, mode: "box", unit_of_measurement: "%" } } },
  { name: "lqi_warn", selector: { number: { min: 1, max: 255, mode: "box" } } },
  { name: "silent_hours", selector: { number: { min: 1, max: 720, mode: "box", unit_of_measurement: "h" } } },
  { name: "exclude", selector: { entity: { multiple: true } } },
  { name: "expanded", selector: { boolean: {} } },
  THEME_SELECT,
  TEXT_SIZE,
];
const ZB_LABELS = {
  title: "Titre",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  source: "Appareils suivis",
  include_phones: "Inclure téléphones et tablettes (Companion App)",
  warn: "Pile orange en dessous de",
  alert: "Pile rouge (à changer) en dessous de",
  lqi_warn: "Qualité du lien Zigbee orange en dessous de (0 à 255)",
  silent_hours: "Appareil silencieux sans nouvelle depuis",
  exclude: "Entités ou appareils à ignorer",
  expanded: "Groupes « Piles en bon état » et « Sur secteur » dépliés à l'ouverture",
  theme: "Couleurs de la carte",
};
const ServeurHaZigbeeCardEditor = makeEditor(ZB_SCHEMA, ZB_LABELS, ZB_DEFAULTS, EN_EDITOR_LABELS.ZB, PL_EDITOR_LABELS.ZB);
const WG_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "expanded", selector: { boolean: {} } },
  { name: "show_endpoint", selector: { boolean: {} } },
  { name: "names", selector: { object: {} } },
  THEME_SELECT,
  TEXT_SIZE,
];
const WG_LABELS = {
  title: "Titre",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  expanded: "Serveurs dépliés à l'ouverture",
  show_endpoint: "Afficher l'adresse publique des pairs (sinon au survol)",
  names: "Noms des pairs dans la carte (YAML : nom d'origine: nouveau nom)",
  theme: "Couleurs de la carte",
};
const ServeurHaWireguardCardEditor = makeEditor(WG_SCHEMA, WG_LABELS, WG_DEFAULTS, EN_EDITOR_LABELS.WG, PL_EDITOR_LABELS.WG);
const GL_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "expanded", selector: { boolean: {} } },
  { name: "temp_warn", selector: { number: { min: 30, max: 120, mode: "box", unit_of_measurement: "°C" } } },
  { name: "temp_alert", selector: { number: { min: 30, max: 120, mode: "box", unit_of_measurement: "°C" } } },
  { name: "net_max", selector: { number: { min: 1, max: 100000, mode: "box", unit_of_measurement: "Mbit/s" } } },
  THEME_SELECT,
  TEXT_SIZE,
];
const GL_LABELS = {
  title: "Titre",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  expanded: "Serveurs dépliés à l'ouverture",
  temp_warn: "Température orange à partir de",
  temp_alert: "Température rouge à partir de",
  net_max: "Pleine échelle des barres réseau",
  theme: "Couleurs de la carte",
};
const ServeurHaGlancesCardEditor = makeEditor(GL_SCHEMA, GL_LABELS, GL_DEFAULTS, EN_EDITOR_LABELS.GL, PL_EDITOR_LABELS.GL);
const MEDIA_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "show_libraries", selector: { boolean: {} } },
  { name: "show_clients", selector: { boolean: {} } },
  { name: "show_controls", selector: { boolean: {} } },
  { name: "control_players", selector: { object: {} } },
  { name: "show_volume", selector: { boolean: {} } },
  { name: "volume_step", selector: { number: { min: 1, max: 25, mode: "box", unit_of_measurement: "%" } } },
  { name: "sleep_timer", selector: { entity: { domain: "timer" } } },
  { name: "sleep_player", selector: { entity: { domain: "media_player" } } },
  { name: "show_details", selector: { boolean: {} } },
  { name: "browse", selector: { boolean: {} } },
  { name: "browse_player", selector: { entity: { domain: "media_player" } } },
  THEME_SELECT,
  TEXT_SIZE,
];
const MEDIA_LABELS = {
  title: "Titre",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  show_libraries: "Afficher les bibliothèques (capteurs à activer dans l'intégration)",
  show_clients: "Liste des lecteurs connus (dépliable)",
  show_controls: "Commandes de lecture (pause, arrêt, avance…)",
  show_volume: "Volume et coupure du son",
  volume_step: "Pas du volume",
  sleep_timer: "Minuteur de la minuterie de veille",
  sleep_player: "Lecteur concerné par la minuterie (vide : tous)",
  show_details: "Bouton Détails",
  browse: "Clic sur une bibliothèque : lister son contenu et lancer la lecture",
  browse_player: "Lecteur choisi par défaut pour lancer la lecture",
  control_players: "Lecteur qui commande l'appareil (YAML : lecteur Plex: lecteur de la TV), sinon trouvé d'après le nom",
  theme: "Couleurs de la carte",
};
const ServeurHaMediaCardEditor = makeEditor(MEDIA_SCHEMA, MEDIA_LABELS, MEDIA_DEFAULTS, EN_EDITOR_LABELS.MEDIA, PL_EDITOR_LABELS.MEDIA);
const DNS_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "servers", selector: { device: { multiple: true, filter: [{ integration: "adguard" }, { integration: "pi_hole" }] } } },
  { name: "show_stats", selector: { boolean: {} } },
  { name: "show_details", selector: { boolean: {} } },
  { name: "show_switches", selector: { boolean: {} } },
  { name: "show_update", selector: { boolean: {} } },
  THEME_SELECT,
  TEXT_SIZE,
];
const DNS_LABELS = {
  title: "Titre (vide = AdGuard Home, Pi-hole ou Filtrage DNS)",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  servers: "Serveurs affichés, dans cet ordre (vide = tous)",
  show_stats: "Requêtes et part bloquée",
  show_details: "Section Détails",
  show_switches: "Section Réglages (interrupteurs, pause Pi-hole)",
  show_update: "Section Mise à jour",
  theme: "Couleurs de la carte",
};
const ServeurHaDnsCardEditor = makeEditor(DNS_SCHEMA, DNS_LABELS, DNS_DEFAULTS, EN_EDITOR_LABELS.DNS, PL_EDITOR_LABELS.DNS);
const LNX_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "entities", selector: { entity: { domain: "update", multiple: true } } },
  { name: "show_uptodate", selector: { boolean: {} } },
  { name: "show_os", selector: { boolean: {} } },
  { name: "show_packages", selector: { boolean: {} } },
  { name: "show_actions", selector: { boolean: {} } },
  { name: "show_app", selector: { boolean: {} } },
  THEME_SELECT,
  TEXT_SIZE,
];
const LNX_LABELS = {
  title: "Titre",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  entities: "Serveurs affichés, dans cet ordre (vide = tous, détectés)",
  show_uptodate: "Afficher aussi les serveurs à jour",
  show_os: "Système, noyau et durée d'allumage",
  show_packages: "Liste des paquets en attente (dépliable)",
  show_actions: "Bouton Mettre à jour (deux clics)",
  show_app: "Mise à jour de Linux Update Dashboard",
  theme: "Couleurs de la carte",
};
const ServeurHaLinuxCardEditor = makeEditor(LNX_SCHEMA, LNX_LABELS, LNX_DEFAULTS, EN_EDITOR_LABELS.LNX, PL_EDITOR_LABELS.LNX);
const GH_SCHEMA = [
  { name: "user", selector: { text: {} } },
  { name: "types", selector: { select: { mode: "dropdown", options: [
    { value: "all", label: "Issues et pull requests" }, { value: "issues", label: "Issues seulement" }, { value: "prs", label: "Pull requests seulement" }] } } },
  { name: "exclude", selector: { text: { multiple: true } } },
  { name: "repos", selector: { text: { multiple: true } } },
  { name: "hide_bots", selector: { boolean: {} } },
  { name: "exclude_authors", selector: { text: { multiple: true } } },
  { name: "title", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "icon_color", selector: { text: {} } },
  { name: "refresh", selector: { number: { min: 5, max: 120, step: 5, mode: "box", unit_of_measurement: "min" } } },
  { name: "max_items", selector: { number: { min: 5, max: 100, step: 5, mode: "box" } } },
  { name: "expanded", selector: { boolean: {} } },
  { name: "show_labels", selector: { boolean: {} } },
  THEME_SELECT,
  TEXT_SIZE,
];
const GH_LABELS = {
  user: "Compte ou organisation GitHub suivi",
  types: "Éléments affichés",
  exclude: "Dépôts à ignorer",
  repos: "Dépôts à suivre (vide = tous)",
  hide_bots: "Masquer ce qu'ouvrent les robots (github-actions, dependabot…)",
  exclude_authors: "Auteurs à masquer",
  title: "Titre",
  icon: "Icône",
  icon_color: "Couleur de l'icône",
  refresh: "Lecture de GitHub toutes les (minutes, 5 au moins)",
  max_items: "Nombre d'éléments affichés au plus",
  expanded: "Dépôts dépliés à l'ouverture",
  show_labels: "Étiquettes (bug, demande…)",
  theme: "Couleurs de la carte",
};
const ServeurHaGithubCardEditor = makeEditor(GH_SCHEMA, GH_LABELS, GH_DEFAULTS, EN_EDITOR_LABELS.GH, PL_EDITOR_LABELS.GH);

/* ---------------------------------------------------------- enregistrement */

/* ------------------------------------------------- ancienne carte OPNsense (déplacée) */

/** La carte OPNsense, testée ici en bêta (0.7.0-beta.1 à 3), a maintenant son propre dépôt :
 *  ce petit élément indique où la trouver à ceux qui l'avaient déjà mise sur un tableau de bord. */
class ServeurHaOpnsenseMoved extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._render();
  }

  getCardSize() {
    return 2;
  }

  _render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `${STYLE}<ha-card class="${themeClass(this._config?.theme, this._hass)}">
      <div class="empty">La carte OPNsense a déménagé<span>Elle a maintenant son propre dépôt : installez « Carte OPNsense » depuis HACS
      (dépôt personnalisé https://github.com/Marlboro62/opnsense-card), puis remplacez <code>custom:serveur-ha-opnsense-card</code>
      par <code>custom:opnsense-card</code> dans ce tableau de bord. Les options restent les mêmes.</span></div></ha-card>`;
  }
}

[
  ServeurHaCard, ServeurHaMajCard, ServeurHaNasCard, ServeurHaProxmoxCard,
  ServeurHaOmvCard, ServeurHaAsusCard, ServeurHaPingCard, ServeurHaZigbeeCard,
  ServeurHaWireguardCard, ServeurHaGlancesCard, ServeurHaMediaCard,
  ServeurHaDnsCard, ServeurHaLinuxCard, ServeurHaGithubCard,
  ServeurHaOpnsenseMoved
].forEach(enableCardLocalization);

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
  define("serveur-ha-omv-card", ServeurHaOmvCard);
  define("serveur-ha-omv-card-editor", ServeurHaOmvCardEditor);
  define("serveur-ha-asus-card", ServeurHaAsusCard);
  define("serveur-ha-asus-card-editor", ServeurHaAsusCardEditor);
  define("serveur-ha-ping-card", ServeurHaPingCard);
  define("serveur-ha-ping-card-editor", ServeurHaPingCardEditor);
  define("serveur-ha-zigbee-card", ServeurHaZigbeeCard);
  define("serveur-ha-zigbee-card-editor", ServeurHaZigbeeCardEditor);
  define("serveur-ha-wireguard-card", ServeurHaWireguardCard);
  define("serveur-ha-wireguard-card-editor", ServeurHaWireguardCardEditor);
  define("serveur-ha-glances-card", ServeurHaGlancesCard);
  define("serveur-ha-glances-card-editor", ServeurHaGlancesCardEditor);
  define("serveur-ha-media-card", ServeurHaMediaCard);
  define("serveur-ha-media-card-editor", ServeurHaMediaCardEditor);
  define("serveur-ha-dns-card", ServeurHaDnsCard);
  define("serveur-ha-dns-card-editor", ServeurHaDnsCardEditor);
  define("serveur-ha-linux-card", ServeurHaLinuxCard);
  define("serveur-ha-linux-card-editor", ServeurHaLinuxCardEditor);
  define("serveur-ha-github-card", ServeurHaGithubCard);
  define("serveur-ha-github-card-editor", ServeurHaGithubCardEditor);
  define("serveur-ha-opnsense-card", ServeurHaOpnsenseMoved);
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
  if (!window.customCards.some((c) => c.type === "serveur-ha-omv-card")) {
    window.customCards.push({
      type: "serveur-ha-omv-card",
      name: "Carte OpenMediaVault",
      description: "OpenMediaVault : système, systèmes de fichiers, disques (température, SMART), services, réseau, mises à jour, redémarrage et arrêt confirmés.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-asus-card")) {
    window.customCards.push({
      type: "serveur-ha-asus-card",
      name: "Carte Routeur ASUS",
      description: "Routeur ASUS (AsusRouter) : Internet, débits, Wi-Fi, ports, appareils connectés, VPN, firmware, redémarrage confirmé.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-ping-card")) {
    window.customCards.push({
      type: "serveur-ha-ping-card",
      name: "Carte Réseau (Ping)",
      description: "Appareils suivis par Ping : en ligne ou hors ligne, latence, gigue et perte de paquets, groupés par type ou par pièce.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-zigbee-card")) {
    window.customCards.push({
      type: "serveur-ha-zigbee-card",
      name: "Carte Zigbee et piles",
      description: "Piles à changer et piles faibles, appareils Zigbee hors ligne, signal faible ou silencieux, état du pont Zigbee2MQTT.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-wireguard-card")) {
    window.customCards.push({
      type: "serveur-ha-wireguard-card",
      name: "Carte VPN WireGuard",
      description: "Serveurs WireGuard (WGDashboard) : pairs connectés, dernier handshake, données reçues et envoyées.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-glances-card")) {
    window.customCards.push({
      type: "serveur-ha-glances-card",
      name: "Carte Serveurs Glances",
      description: "Serveurs suivis par Glances : CPU, RAM, disques, températures, ventilateurs, réseau, processus.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-media-card")) {
    window.customCards.push({
      type: "serveur-ha-media-card",
      name: "Carte Serveurs multimédia (Plex, Jellyfin, Emby)",
      description: "Ce qui est en lecture, qui regarde et où, avancement, bibliothèques et mises à jour des serveurs Plex, Jellyfin ou Emby.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-dns-card")) {
    window.customCards.push({
      type: "serveur-ha-dns-card",
      name: "Carte Filtrage DNS (AdGuard Home, Pi-hole)",
      description: "Requêtes, part bloquée, temps de réponse, protection et réglages, mises à jour d'AdGuard Home ou de Pi-hole.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-linux-card")) {
    window.customCards.push({
      type: "serveur-ha-linux-card",
      name: "Carte Serveurs Linux (mises à jour)",
      description: "Mises à jour des serveurs Linux suivis par Linux Update Dashboard : paquets, sécurité, redémarrage, installation confirmée.",
      preview: true,
    });
  }
  if (!window.customCards.some((c) => c.type === "serveur-ha-github-card")) {
    window.customCards.push({
      type: "serveur-ha-github-card",
      name: "Carte GitHub (issues et pull requests)",
      description: "Issues et pull requests ouvertes sur les dépôts d'un compte GitHub, groupées par dépôt, avec les nouvelles depuis la dernière visite.",
      preview: true,
    });
  }
  // Card picker entries are registered before hass is provided.  Use the
  // document's UI language for their descriptive metadata (not the YAML override).
  const catalogLang = String(document.documentElement?.lang || navigator.language || "fr").toLowerCase();
  if (!catalogLang.startsWith("fr")) {
    const catalogEnglish = {
      "serveur-ha-card": ["HA Server", "Home Assistant host CPU, temperatures, memory, disks, network, uptime, power and backups."],
      "serveur-ha-maj-card": ["Home Assistant Updates", "Core, Supervisor, OS, application updates, database size and SSL certificate."],
      "serveur-ha-nas-card": ["Synology NAS", "Synology NAS volumes, disks, health, CPU, RAM, temperatures, cooling, network and UPS."],
      "serveur-ha-proxmox-card": ["Proxmox VE", "Proxmox nodes, storage, VMs, containers, updates and confirmed power controls."],
      "serveur-ha-omv-card": ["OpenMediaVault", "System, file systems, SMART disk health, services, network, updates and power controls."],
      "serveur-ha-asus-card": ["ASUS Router", "Internet, Wi-Fi, wired ports, clients, VPN, firmware and restart via AsusRouter."],
      "serveur-ha-ping-card": ["Network (Ping)", "Ping-monitored devices, online status, latency, jitter and packet loss grouped by room or type."],
      "serveur-ha-zigbee-card": ["Zigbee & Batteries", "Low and critical batteries, offline Zigbee devices, poor links and Zigbee2MQTT bridge status."],
      "serveur-ha-wireguard-card": ["WireGuard VPN", "WGDashboard servers, connected peers, handshakes and incoming/outgoing traffic."],
      "serveur-ha-glances-card": ["Glances Servers", "System usage, disks, temperatures, cooling, network and processes from Glances."],
      "serveur-ha-media-card": ["Media Servers", "Plex, Jellyfin and Emby playback, players, libraries and server updates."],
      "serveur-ha-dns-card": ["DNS Filtering", "AdGuard Home and Pi-hole queries, blocking, response time, settings and updates."],
      "serveur-ha-linux-card": ["Linux Server Updates", "Linux Update Dashboard package updates, security updates, reboot status and confirmed installs."],
      "serveur-ha-github-card": ["GitHub Issues & PRs", "Open GitHub issues and pull requests grouped by repository, highlighting new activity."],
    };
    const catalogPolish = {
      "serveur-ha-card": ["Serwer Home Assistant", "CPU, temperatury, RAM, dyski, sieć, czas pracy, zasilanie i kopie zapasowe hosta Home Assistant."],
      "serveur-ha-maj-card": ["Aktualizacje Home Assistant", "Aktualizacje Core, Supervisor, OS i aplikacji, rozmiar bazy danych oraz certyfikat SSL."],
      "serveur-ha-nas-card": ["NAS Synology", "Woluminy, dyski, kondycja, CPU, RAM, temperatury, wentylatory, sieć i UPS."],
      "serveur-ha-proxmox-card": ["Proxmox VE", "Węzły, pamięć masowa, maszyny wirtualne, kontenery, aktualizacje i sterowanie zasilaniem."],
      "serveur-ha-omv-card": ["OpenMediaVault", "System, systemy plików, SMART dysków, usługi, sieć, aktualizacje i zasilanie."],
      "serveur-ha-asus-card": ["Router ASUS", "Internet, Wi-Fi, porty LAN, klienci, VPN, firmware i ponowne uruchomienie przez AsusRouter."],
      "serveur-ha-ping-card": ["Sieć (Ping)", "Monitorowanie dostępności urządzeń, opóźnień i utraty pakietów według typu lub pomieszczenia."],
      "serveur-ha-zigbee-card": ["Zigbee i baterie", "Niskie poziomy baterii, urządzenia Zigbee offline, jakość połączenia i stan bramki Zigbee2MQTT."],
      "serveur-ha-wireguard-card": ["VPN WireGuard", "Serwery WGDashboard, połączone peery, handshake oraz ruch przychodzący i wychodzący."],
      "serveur-ha-glances-card": ["Serwery Glances", "CPU, RAM, dyski, temperatury, wentylatory, sieć i procesy z Glances."],
      "serveur-ha-media-card": ["Serwery multimediów", "Odtwarzanie Plex, Jellyfin i Emby, odtwarzacze, biblioteki i aktualizacje."],
      "serveur-ha-dns-card": ["Filtrowanie DNS", "Zapytania AdGuard Home i Pi-hole, blokowanie, czas odpowiedzi, ustawienia i aktualizacje."],
      "serveur-ha-linux-card": ["Aktualizacje serwerów Linux", "Pakiety, aktualizacje bezpieczeństwa, restarty i instalacja przez Linux Update Dashboard."],
      "serveur-ha-github-card": ["Zgłoszenia i PR GitHub", "Otwarte zgłoszenia i pull requesty w repozytoriach oraz nowe aktywności."],
    };
    const catalog = catalogLang.startsWith("pl") ? catalogPolish : catalogEnglish;
    for (const item of window.customCards) {
      if (!catalog[item.type]) continue;
      [item.name, item.description] = catalog[item.type];
    }
  }

  console.info(`%c SERVEUR-HA-CARD %c ${CARD_VERSION} `, "background:#96d21f;color:#1a2434;font-weight:700", "background:#1d93e3;color:#fff");
}
})();
