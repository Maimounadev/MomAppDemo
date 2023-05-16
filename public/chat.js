
const chatForm = document.getElementById('chat-form')
const chatMessages = document.querySelector('.chat-messages')
const roomName = document.getElementById('room-name')
const userList = document.getElementById('users')
let urlString = "/groupChat"
let paramString = urlString.split('?')[1];
let queryString = new URLSearchParams(paramString);
console.log({queryString})
// GET USERNAME AND ROOM FROM URL =========
let { username, room, chatroom } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
})
console.log({chatroom})
if (!room) {
  room = 'Chat'
}
const socket = io()


// JOIN CHATROOM ========
socket.emit('joinRoom', { username, room })

// GET ROOM AND USERS
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room)
  outputUsers(users)
})

// MESSAGE FROM SERVER =========
socket.on('message', message => {
  outputMessage(message)

  // SCROLL DOWN ========
  chatMessages.scrollTop = chatMessages.scrollHeight
})

// MESSAGE FROM SERVER =========

socket.on('inviteRoom', privateRoom => {
    console.log({privateRoom})
  if (username === privateRoom.slice(privateRoom.indexOf('/') + 1)) {
    window.location.href = `/chat?username=${username}&room=${privateRoom}`
  }
})

// MESSAGE SUBMIT ==========
chatForm.addEventListener('submit', (e) => {
  e.preventDefault()

  // GET MESSAGE TEXT =======
  const msg = e.target.elements.msg.value

  // EMIT MESSAGE TO SERVER ======
  socket.emit('chatMessage', msg)

  // CLEAR INPUT ========
  e.target.elements.msg.value = ''
  e.target.elements.msg.focus()
})

// OUTPUT MESSAGE TO DOM
function outputMessage(message) {
  console.log(message, 'in outputMessage()')
  const div = document.createElement('div')
  div.classList.add('message')
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>`
  document.querySelector('.chat-messages').appendChild(div)
}

// ADD ROOM NAME TO DOM
function outputRoomName(room) {
  roomName.innerText = chatroom
}

// ADD USERS TO DOM
function outputUsers(users) {
  userList.innerHTML = `
    ${users.map(user => `<li class='chatUser'>${user.username}</li>`).join('')}
    `
  const chatUsers = document.getElementsByClassName('chatUser')
  Array.from(chatUsers).forEach(function (element) {
    if (element.innerText != username && room == 'Chat') {
      element.addEventListener('click', function () {
        const targetUsername = this.innerText
        const privateRoom = username + '/' + targetUsername
      

        socket.emit('chatInviteRoom', privateRoom)
        window.location.href = `/chat?username=${username}&otherUsername=${targetUsername}&room=${privateRoom}`

      });
    }

  });
}  