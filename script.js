/* =========================================
   MYCHAT - MAIN SCRIPT
========================================= */


/* =========================================
   SUPABASE CONFIG
========================================= */

// Supabase Dashboard se ye 2 values copy karo.

const SUPABASE_URL = "https://gedavvaztkniulbrpgfs.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_AIAonJnEyAllwOnNeygJKQ_K2sUYm8F";


/* =========================================
   CREATE SUPABASE CLIENT
========================================= */

const supabaseClient = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
);


/* =========================================
   GLOBAL APP STATE
========================================= */

let currentUser = null;
let currentUsername = null;


/* =========================================
   DOM ELEMENTS
========================================= */

const authSection =
document.getElementById("authSection");

const chatSection =
document.getElementById("chatSection");

const currentUsernameElement =
document.getElementById("currentUsername");

const showLoginBtn =
document.getElementById("showLoginBtn");

const showSignupBtn =
document.getElementById("showSignupBtn");

const signupBox =
document.getElementById("signupBox");

const loginBox =
document.getElementById("loginBox");

const logoutBtn =
document.getElementById("logoutBtn");


/* =========================================
   SWITCH TO LOGIN
========================================= */

if (showLoginBtn) {

showLoginBtn.addEventListener("click", () => {

signupBox.classList.add("hidden");

loginBox.classList.remove("hidden");

});

}

/* =========================================
   OPEN LOGIN FROM CONFIRM PAGE
========================================= */

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("login") === "1") {

signupBox.classList.add("hidden");

loginBox.classList.remove("hidden");

}

/* =========================================
   SWITCH TO SIGNUP
========================================= */

if (showSignupBtn) {

showSignupBtn.addEventListener("click", () => {

loginBox.classList.add("hidden");

signupBox.classList.remove("hidden");

});

}


/* =========================================
   SHOW AUTH SCREEN
========================================= */

function showAuthScreen() {

authSection.classList.remove("hidden");

chatSection.classList.add("hidden");

}


/* =========================================
   SHOW CHAT SCREEN
========================================= */

function showChatScreen() {

authSection.classList.add("hidden");

chatSection.classList.remove("hidden");

}


/* =========================================
   SET CURRENT USERNAME
========================================= */

function setCurrentUsername(username) {

currentUsername = username;

if (currentUsernameElement) {

currentUsernameElement.textContent =
username;

}

}


/* =========================================
   CHECK CURRENT SESSION
========================================= */

async function checkSession() {

try {

const {
data: {
session
}
} = await supabaseClient.auth.getSession();


if (session && session.user) {

currentUser = session.user;

await loadUserProfile();

} else {

currentUser = null;

showAuthScreen();

}

} catch (error) {

console.error(
"Session check error:",
error
);

showAuthScreen();

}

}


/* =========================================
   LOAD USER PROFILE
========================================= */

async function loadUserProfile() {

if (!currentUser) {
return;
}


const {
data,
error
} = await supabaseClient
.from("Profiles")
.select("username")
.eq("id", currentUser.id)
.maybeSingle();


if (error) {

console.error(
"Profile loading error:",
error
);

return;

}


if (data) {

setCurrentUsername(
data.username
);

showChatScreen();

} else {

console.warn(
"Profile not found."
);

showAuthScreen();

}

}


/* =========================================
   LOGOUT
========================================= */

if (logoutBtn) {

logoutBtn.addEventListener(
"click",
async () => {

const {
error
} = await supabaseClient.auth.signOut();


if (error) {

console.error(
"Logout error:",
error
);

return;

}


currentUser = null;

currentUsername = null;

showAuthScreen();

}
);

}


/* =========================================
   AUTH STATE LISTENER
========================================= */

supabaseClient.auth.onAuthStateChange(
async (event, session) => {

if (
event === "SIGNED_IN" &&
session
) {

currentUser =
session.user;

await loadUserProfile();

}


if (
event === "SIGNED_OUT"
) {

currentUser = null;

currentUsername = null;

showAuthScreen();

}

}
);


/* =========================================
   START APP
========================================= */

checkSession();