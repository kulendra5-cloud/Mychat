/* =========================================
   MYCHAT - CHAT SYSTEM
========================================= */


/* =========================================
   DOM ELEMENTS
========================================= */

const messagesContainer =
document.getElementById("messagesContainer");

const messageInput =
document.getElementById("messageInput");

const sendBtn =
document.getElementById("sendBtn");


/* =========================================
   LOAD MESSAGES
========================================= */

async function loadMessages() {

if (!messagesContainer) {
return;
}


const {
data,
error
} = await supabaseClient
.from("messages")
.select("*")
.order("created_at", {
ascending: true
});


if (error) {

console.error(
"Messages loading error:",
error
);

return;

}


messagesContainer.innerHTML = "";


data.forEach(message => {

displayMessage(message);

});


scrollToBottom();

}


/* =========================================
   DISPLAY MESSAGE
========================================= */

function displayMessage(message) {

if (!messagesContainer) {
return;
}


const isOwnMessage =
currentUser &&
message.sender_id === currentUser.id;


const row =
document.createElement("div");

row.classList.add("message-row");


if (isOwnMessage) {

row.classList.add("outgoing");

} else {

row.classList.add("incoming");

}


const bubble =
document.createElement("div");

bubble.classList.add("message-bubble");


/* Sender name */

if (!isOwnMessage) {

const senderName =
document.createElement("div");

senderName.classList.add("sender-name");

senderName.textContent =
message.sender_name;

bubble.appendChild(
senderName
);

}


/* Message text */

const messageText =
document.createElement("div");

messageText.textContent =
message.message;

bubble.appendChild(
messageText
);


/* Time */

const messageTime =
document.createElement("span");

messageTime.classList.add("message-time");

messageTime.textContent =
formatMessageTime(
message.created_at
);

bubble.appendChild(
messageTime
);


row.appendChild(
bubble
);

messagesContainer.appendChild(
row
);

}


/* =========================================
   FORMAT MESSAGE TIME
========================================= */

function formatMessageTime(dateString) {

const date =
new Date(dateString);


return date.toLocaleTimeString(
[],
{
hour: "2-digit",
minute: "2-digit"
}
);

}


/* =========================================
   SCROLL TO BOTTOM
========================================= */

function scrollToBottom() {

if (!messagesContainer) {
return;
}


messagesContainer.scrollTop =
messagesContainer.scrollHeight;

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

if (!currentUser ||
!currentUsername) {

return;

}


const message =
messageInput.value.trim();


if (!message) {
return;
}


sendBtn.disabled = true;


try {

const {
error
} = await supabaseClient
.from("messages")
.insert({

sender_id:
currentUser.id,

sender_name:
currentUsername,

message:
message

});


if (error) {

throw error;

}


messageInput.value = "";

messageInput.focus();


} catch (error) {

console.error(
"Send message error:",
error
);

alert(
"Message send nahi hua."
);

} finally {

sendBtn.disabled = false;

}

}


/* =========================================
   SEND BUTTON
========================================= */

if (sendBtn) {

sendBtn.addEventListener(
"click",
sendMessage
);

}


/* =========================================
   ENTER TO SEND
========================================= */

if (messageInput) {

messageInput.addEventListener(
"keydown",
event => {

if (
event.key === "Enter" &&
!event.shiftKey
) {

event.preventDefault();

sendMessage();

}

}
);

}


/* =========================================
   REALTIME MESSAGES
========================================= */

const messageChannel =
supabaseClient
.channel("mychat-messages")
.on(
"postgres_changes",
{
event: "INSERT",
schema: "public",
table: "messages"
},
payload => {

displayMessage(
payload.new
);

scrollToBottom();

}
)
.subscribe();


/* =========================================
   INITIAL LOAD
========================================= */

loadMessages();