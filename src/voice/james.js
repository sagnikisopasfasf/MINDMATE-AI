export async function speakJames(text){

const response = await fetch("/voice/james",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({text:text})
});

const audio = await response.blob();
const url = URL.createObjectURL(audio);

new Audio(url).play();

}