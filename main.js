const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector('.chat-list')
const toggleThemeButton = document.querySelector('#toggle-theme-button')
const deleteChatButton = document.querySelector('#delete-chat-button')
const suggestions = document.querySelectorAll('.suggestion-list .suggestion')



let userMessage = null;
let isResponseGenerating = false; 

const API_KEY = 'AIzaSyBMRvjy8tUggPkG6g0v7chPiqW6IB7JZAI';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
 

const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem('savedChats');
    const isLightMode = (localStorage.getItem('themeColor') === 'light_mode');
    // apply the restored theme
    document.body.classList.toggle("light_mode" , isLightMode);
    toggleThemeButton.textContent = isLightMode ? "dark_mode" : "light_mode";

    // apply saved chats
    chatList.innerHTML = savedChats || '';
    document.body.classList.toggle('hide-header' , savedChats)
    // scroll to the bottom 
    chatList.scrollTo(0,chatList.scrollHeight)
}

loadLocalStorageData();

// create a message element and return it 
const createMessageElement = (content , ...classes) => {
    const div = document.createElement('div');
    div.classList.add('message' , ...classes);
    div.innerHTML = content;
    return div;
}



// show words one by one 
const showTypingEffect = (text, textElement) => {
    const words = text.split(' ') ;
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        textElement.textContent += (currentWordIndex === 0 ? '' : '') + words[currentWordIndex++];
        // incomingMessageDiv.querySelector('.icon').classList.add('hide');
        if(currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            // incomingMessageDiv.querySelector('.icon').classList.remove('hide')
            localStorage.setItem("savedChats" , chatList.innerHTML); // save chats in local storage
            // scroll to bottom while typing
            chatList.scrollTo(0,chatList.scrollHeight)
        }
    }, 100)
}

const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector('.text');

    try {
        const response = await fetch(API_URL , {
            method:'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [{
                    role:'user',
                    parts: [{ text: userMessage}]
                }]
            })
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        // console.log(data);
        
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g , "$1");
        showTypingEffect(apiResponse , textElement)
        // console.log(apiResponse);
        textElement.textContent = apiResponse;

    } catch(error) {
        isResponseGenerating = false;
        console.log(error);
        textElement.textContent = error.message;
        textElement.classList.add('error')
    } finally {
        incomingMessageDiv.classList.remove('loading')
    }
}

const showLoadingAnimation = () => {
    const html = `
          <div class="message-content">
               <img src="images/gemini.svg" class="avatar" alt="">
               <p class="text">
               </p>
               <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
               </div>
            </div>
         <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
    `

   const incomingMessageDiv =  createMessageElement(html , 'incoming' ,'loading' );
   chatList.appendChild(incomingMessageDiv);
    // scroll to the bottom 
    chatList.scrollTo(0,chatList.scrollHeight)
   generateAPIResponse(incomingMessageDiv);
}

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector('.text').textContent;
    navigator.clipboard.writeText(messageText);

    copyIcon.textContent = "Done";
    // revert icon after one second
    setTimeout(() => {
        copyIcon.textContent = "content_copy";
    }, 1000);
}

// handle sending message outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector('.typing-input').value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return // exit if there is no message

    isResponseGenerating = true;
    // console.log(userMessage);

    const html = `
        <div class="message-content">
            <img src="images/user.jpg" class="avatar" alt="">
            <p class="text">
            </p>
        </div>
    `

   const outgoingMessageDiv =  createMessageElement(html ,'outgoing');
   outgoingMessageDiv.querySelector('.text').textContent = userMessage;
   chatList.appendChild(outgoingMessageDiv);

   typingForm.reset(); // clear input field
    // show header 
    document.body.classList.add('hide-header')
    // scroll to the bottom 
    chatList.scrollTo(0,chatList.scrollHeight)
   setTimeout(showLoadingAnimation , 500) // show loading animation after a delay
}

suggestions.forEach((suggestion) => {
    suggestion.addEventListener('click' , () => {
        userMessage = suggestion.querySelector(".text").textContent;
        handleOutgoingChat();
    })
})

typingForm.addEventListener('submit' , (e) => {
    e.preventDefault();

    handleOutgoingChat()
})


// switch between dark mode and light mode
toggleThemeButton.addEventListener('click' , () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor" , isLightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.textContent = isLightMode ? "dark_mode" : "light_mode"
})

// clear the chat
deleteChatButton.addEventListener('click' , () => {
    if(confirm("Are you sure you want to delete all the chats here?")) {
        localStorage.removeItem('savedChats');
        loadLocalStorageData();
    }
})