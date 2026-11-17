/* =========================================
   MYCHAT - AUTHENTICATION
========================================= */


/* =========================================
   DOM ELEMENTS
========================================= */

const signupName =
document.getElementById("signupName");

const signupEmail =
document.getElementById("signupEmail");

const signupPassword =
document.getElementById("signupPassword");

const signupBtn =
document.getElementById("signupBtn");

const signupMessage =
document.getElementById("signupMessage");


const loginEmail =
document.getElementById("loginEmail");

const loginPassword =
document.getElementById("loginPassword");

const loginBtn =
document.getElementById("loginBtn");

const loginMessage =
document.getElementById("loginMessage");


/* =========================================
   MESSAGE HELPER
========================================= */

function showSignupMessage(message) {

if (signupMessage) {
signupMessage.textContent = message;
}

}


function showLoginMessage(message) {

if (loginMessage) {
loginMessage.textContent = message;
}

}


/* =========================================
   SIGN UP
========================================= */

if (signupBtn) {

signupBtn.addEventListener("click", async () => {

const name =
signupName.value.trim();

const email =
signupEmail.value.trim();

const password =
signupPassword.value;


showSignupMessage("");


/* Check fields */

if (!name || !email || !password) {

showSignupMessage(
"Please fill all fields."
);

return;
}


if (name.length < 3) {

showSignupMessage(
"Name must be at least 3 characters."
);

return;
}


if (password.length < 6) {

showSignupMessage(
"Password must be at least 6 characters."
);

return;
}


signupBtn.disabled = true;

signupBtn.textContent =
"Creating account...";


try {

/* =================================
               CHECK USERNAME
            ================================= */

const {
data: existingProfile,
error: usernameError
} = await supabaseClient
.from("Profiles")
.select("id")
.eq("username", name)
.maybeSingle();


if (usernameError) {

throw usernameError;

}


if (existingProfile) {

showSignupMessage(
"This MyChat name is already taken."
);

return;

}


/* =================================
               CREATE AUTH ACCOUNT
            ================================= */

const {
data,
error
} = await supabaseClient.auth.signUp({
email: email,
password: password,
options: {
emailRedirectTo: new URL("confirm.html", window.location.href).href
}
});


if (error) {

throw error;

}


if (!data.user) {

throw new Error(
"Account could not be created."
);

}


/* =================================
               CREATE PROFILE
            ================================= */

const {
error: profileError
} = await supabaseClient
.from("Profiles")
.insert({
id: data.user.id,
username: name
});


if (profileError) {

throw profileError;

}


/* =================================
               EMAIL CONFIRMATION
            ================================= */

showSignupMessage(
"Account created. Please check your email and confirm your account."
);


signupName.value = "";
signupEmail.value = "";
signupPassword.value = "";


} catch (error) {

console.error(
"Signup error:",
error
);


showSignupMessage(
error.message ||
"Something went wrong."
);

} finally {

signupBtn.disabled = false;

signupBtn.textContent =
"Create Account";

}

});

}


/* =========================================
   LOGIN
========================================= */

if (loginBtn) {

loginBtn.addEventListener("click", async () => {

const email =
loginEmail.value.trim();

const password =
loginPassword.value;


showLoginMessage("");


if (!email || !password) {

showLoginMessage(
"Please enter email and password."
);

return;

}


loginBtn.disabled = true;

loginBtn.textContent =
"Logging in...";


try {

const {
data,
error
} = await supabaseClient.auth.signInWithPassword({
email: email,
password: password
});


if (error) {

throw error;

}


currentUser =
data.user;


await loadUserProfile();


} catch (error) {

console.error(
"Login error:",
error
);


showLoginMessage(
error.message ||
"Login failed."
);

} finally {

loginBtn.disabled = false;

loginBtn.textContent =
"Login";

}

});

}