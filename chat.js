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
   USER MESSAGE CUTOFF
========================================= */

function getMessageCutoffKey() {

    if (!currentUser) {
        return null;
    }

    return `mychat_cutoff_${currentUser.id}`;

}


function getMessageCutoff() {

    const key = getMessageCutoffKey();

    if (!key) {
        return null;
    }

    return localStorage.getItem(key);

}


function setMessageCutoff() {

    const key = getMessageCutoffKey();

    if (!key) {
        return;
    }

    localStorage.setItem(
        key,
        new Date().toISOString()
    );

}


/* =========================================
   CREATE FIRST CUTOFF
========================================= */

function ensureMessageCutoff() {

    const key = getMessageCutoffKey();

    if (!key) {
        return;
    }

    const existingCutoff =
        localStorage.getItem(key);

    if (!existingCutoff) {

        localStorage.setItem(
            key,
            new Date().toISOString()
        );

    }

}


/* =========================================
   CHECK MESSAGE VISIBILITY
========================================= */

function shouldShowMessage(message) {

    const cutoff =
        getMessageCutoff();

    if (!cutoff) {
        return true;
    }

    const messageTime =
        new Date(message.created_at).getTime();

    const cutoffTime =
        new Date(cutoff).getTime();

    return messageTime > cutoffTime;

}


/* =========================================
   CLEAR CHAT SCREEN
========================================= */

function clearChatScreen() {

    if (messagesContainer) {

        messagesContainer.innerHTML = "";

    }

}


/* =========================================
   LOAD MESSAGES
========================================= */

async function loadMessages() {

    if (!messagesContainer) {
        return;
    }


    const cutoff =
        getMessageCutoff();


    let query =
        supabaseClient
        .from("messages")
        .select("*");


    /*
       If this user has a cutoff,
       only load messages after that time.
    */

    if (cutoff) {

        query =
            query.gt(
                "created_at",
                cutoff
            );

    }


    const {
        data,
        error
    } = await query
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

        if (shouldShowMessage(message)) {

            displayMessage(message);

        }

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


    /*
       Never display a message that belongs
       before this user's cutoff.
    */

    if (!shouldShowMessage(message)) {
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

                /*
                   Only display messages that are
                   newer than this user's cutoff.
                */

                if (
                    shouldShowMessage(
                        payload.new
                    )
                ) {

                    displayMessage(
                        payload.new
                    );

                    scrollToBottom();

                }

            }
        )
        .subscribe();


/* =========================================
   INITIAL LOAD
========================================= */

ensureMessageCutoff();

loadMessages();


/* =========================================
   PAGE / TAB CLOSE
========================================= */

window.addEventListener(
    "pagehide",
    () => {

        /*
           Save the exact time when the user
           leaves/closes the page.
        */

        setMessageCutoff();

        clearChatScreen();

    }
);