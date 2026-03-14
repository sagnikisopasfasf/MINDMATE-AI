export async function speakMichael(text){

const response = await fetch("/voice/michael",{
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