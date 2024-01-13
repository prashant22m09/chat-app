const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room} = Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoscroll = ()=>{
    //new message element
    const $newMessage = $messages.lastElementChild
    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //visible height
    const visibleHeight = $messages.offsetHeight
    //height of messages container
    const containerHeight = $messages.scrollHeight
    //how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message.text)
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message)=>{
    console.log(message.url)
    const html = Mustache.render(locationMessageTemplate,{
        username:message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sideBarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled','disabled')
    //const message = document.querySelector('input').value
    const message = e.target.elements.message.value //selecting input by name

    socket.emit('sendMessage', message, (error)=>{
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message delivered')// this function runs as an acknowledgement
    })
})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position)
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})