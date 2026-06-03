// ── CONFIG & GLOBAL STATE ────────────────────────────────────────────────────
// API keys
const UK='ylROEYPBWlyNF_ugwFmefRyruAWfr6xUHlwISoXiJk4';
const SB_URL = 'https://zionhfdaksktpwcvjnde.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppb25oZmRha3NrdHB3Y3ZqbmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzYyMjcsImV4cCI6MjA5MDg1MjIyN30.6nLi71KlbXvRsC5Z0g51XGxiXgOBu9TKxbs6T2mYm9A';
// State variables
let selImgUrl=null,croppedDataUrl=null,curOp='addition',curLvl=1,curMode='random';
let allProbs=[],selProbs=[],hintCount=0,hints=['','','','',''],timerEnabled=false,timerMins=5,diffEnabled=false,calcEnabled=false,numProbs=20;
let aiTutorEnabled=false,aiHelpLimit=0;
let editingActivityId=null;
let generatedHTML='';
let edAR={w:1,h:1},edZoom=100,edPanX=0,edPanY=0,edImg=null;
let isDragging=false,dragSX=0,dragSY=0,dragPX=0,dragPY=0;
let editorReady=false;
// Category state
let curCat = 'ops', curAlgType = 'one', curAlgLv = 1;

// Wizard state
let currentWizStep = 1;
