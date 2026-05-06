// --- State ---
let devicesList = [];
let componentsList = [];
let allLogs = [];
let logPage = 0;
const LOG_PAGE_SIZE = 50;
let deviceSearch = '';
let logFilterComponentId = '';
let logFilterDirection = '';
const deviceComponents = {};
const componentLatest = {};

// --- AutoEngine state ---
let auenNodeTypes = [];
let auenAttributeTypes = [];
let auenNodes = [];
let auenTags = [];
let auenLoaded = false;
let cloningFromNodeId = null;
let nodeFilterTagId = '';

// --- Node collapse state ---
const collapsedNodes = new Set(); // nodeId dei nodi collassati (i figli non vengono mostrati)

// --- Topology collapse state ---
const collapsedTopoNodes = new Set();

// --- Configuration state ---
let cfgSections = [];
let cfgConfigurations = [];
let cfgLoaded = false;

// --- Feature flags ---
let nodeTypeEditAllowed = false;
