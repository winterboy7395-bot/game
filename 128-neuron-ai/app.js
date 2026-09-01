const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
const layers=[8,64,48,8];
const TOTAL_NEURONS=layers.reduce((a,b)=>a+b,0);
document.getElementById('neuronCount').textContent=TOTAL_NEURONS;

class NeuralNetwork{
 constructor(sizes){this.weights=[];this.biases=[];for(let l=1;l<sizes.length;l++){const rows=sizes[l],cols=sizes[l-1],m=[];for(let i=0;i<rows;i++){const r=[];for(let j=0;j<cols;j++)r.push((Math.random()*2-1)*Math.sqrt(2/cols));m.push(r)}this.weights.push(m);this.biases.push(new Array(rows).fill(0))}this.activations=[];this.zValues=[]}
 relu(x){return Math.max(0,x)}
 reluDerivative(x){return x>0?1:0}
 softmax(v){const max=Math.max(...v),e=v.map(x=>Math.exp(x-max)),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s)}
 forward(input){this.activations=[input.slice()];this.zValues=[];let a=input.slice();for(let l=0;l<this.weights.length;l++){const W=this.weights[l],b=this.biases[l],z=[];for(let i=0;i<W.length;i++){let sum=b[i];for(let j=0;j<W[i].length;j++)sum+=W[i][j]*a[j];z.push(sum)}this.zValues.push(z);a=l===this.weights.length-1?this.softmax(z):z.map(x=>this.relu(x));this.activations.push(a)}return a}
 train(input,target,lr){const output=this.forward(input),deltas=[output.map((x,i)=>x-target[i])];for(let l=this.weights.length-2;l>=0;l--){const z=this.zValues[l],nw=this.weights[l+1],nd=deltas[0],d=[];for(let i=0;i<z.length;i++){let e=0;for(let j=0;j<nd.length;j++)e+=nw[j][i]*nd[j];d.push(e*this.reluDerivative(z[i]))}deltas.unshift(d)}for(let l=0;l<this.weights.length;l++){const a=this.activations[l],d=deltas[l];for(let i=0;i<this.weights[l].length;i++){for(let j=0;j<this.weights[l][i].length;j++)this.weights[l][i][j]-=lr*d[i]*a[j];this.biases[l][i]-=lr*d[i]}}let loss=0;for(let i=0;i<target.length;i++)loss-=target[i]*Math.log(output[i]+1e-10);return loss}
 predict(input){const probabilities=this.forward(input);let index=0;for(let i=1;i<probabilities.length;i++)if(probabilities[i]>probabilities[index])index=i;return{index,probabilities}}
}

let brain=new NeuralNetwork(layers);
const trainingData=[];
for(let i=0;i<8;i++){const input=new Array(8).fill(0),target=new Array(8).fill(0);input[i]=1;target[i]=1;trainingData.push({input,target})}

function resizeCanvas(){canvas.width=canvas.clientWidth*devicePixelRatio;canvas.height=canvas.clientHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
window.addEventListener('resize',resizeCanvas);resizeCanvas();
function getNeuronPositions(){const w=canvas.clientWidth,h=canvas.clientHeight,m=100,uw=w-m*2,p=[];for(let l=0;l<layers.length;l++){const x=m+(uw/(layers.length-1))*l,count=layers[l],uh=h-80;for(let i=0;i<count;i++)p.push({layer:l,index:i,x,y:40+(uh/Math.max(count-1,1))*i})}return p}
function drawNetwork(){ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);const pos=getNeuronPositions();for(let l=0;l<layers.length-1;l++){const cur=pos.filter(p=>p.layer===l),next=pos.filter(p=>p.layer===l+1);for(const a of cur)for(const b of next){const weight=brain.weights[l][b.index][a.index];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.globalAlpha=.03+Math.min(Math.abs(weight),1)*.25;ctx.lineWidth=1;ctx.strokeStyle=weight>=0?'#42d4ff':'#ff4d8d';ctx.stroke()}}ctx.globalAlpha=1;for(const p of pos){let activation=0;if(brain.activations[p.layer]?.[p.index])activation=brain.activations[p.layer][p.index];const radius=p.layer===0||p.layer===layers.length-1?7:5,glow=Math.min(Math.abs(activation),1);ctx.beginPath();ctx.arc(p.x,p.y,radius+glow*4,0,Math.PI*2);ctx.globalAlpha=.3+glow*.7;ctx.fillStyle=activation>=0?'#54e1ff':'#ff5c93';ctx.fill();ctx.globalAlpha=1}ctx.fillStyle='#fff';ctx.font='13px Arial';ctx.textAlign='center';const labels=['INPUT','HIDDEN 1','HIDDEN 2','OUTPUT'],w=canvas.clientWidth,m=100,uw=w-m*2;for(let i=0;i<layers.length;i++){const x=m+(uw/(layers.length-1))*i;ctx.fillText(labels[i]+' ('+layers[i]+')',x,22)}}
function animate(){drawNetwork();requestAnimationFrame(animate)}animate();
function log(message){const e=document.getElementById('log'),line=document.createElement('div');line.textContent=message;e.appendChild(line);e.scrollTop=e.scrollHeight}
async function checkServer(){try{const r=await fetch('/api/status');const data=await r.json();document.getElementById('status').textContent='서버 연결됨 · '+data.message;log('Node.js 서버 연결 성공')}catch(e){document.getElementById('status').textContent='서버 연결 실패';log('서버 연결 실패')}}
let training=false;
async function trainAI(){if(training)return;training=true;const epochs=Math.max(1,Number(document.getElementById('epochs').value)||500),lr=Number(document.getElementById('learningRate').value)||.03;document.getElementById('status').textContent='AI 학습 중...';log('AI 학습 시작 · '+TOTAL_NEURONS+' neurons');for(let epoch=0;epoch<epochs;epoch++){let totalLoss=0;const data=[...trainingData].sort(()=>Math.random()-.5);for(const s of data)totalLoss+=brain.train(s.input,s.target,lr);const loss=totalLoss/data.length;document.getElementById('epochText').textContent=epoch+1;document.getElementById('lossText').textContent=loss.toFixed(5);if(epoch%10===0){log('Epoch '+(epoch+1)+' | Loss: '+loss.toFixed(5));await new Promise(r=>setTimeout(r,0))}}training=false;document.getElementById('status').textContent='학습 완료 · 서버 연결됨';log('AI 학습 완료')}
function predictAI(){const input=document.getElementById('testInput').value.split(',').map(Number);if(input.length!==8||input.some(x=>!Number.isFinite(x))){alert('입력값은 숫자 8개여야 합니다.');return}const r=brain.predict(input),prob=(r.probabilities[r.index]*100).toFixed(2);document.getElementById('prediction').textContent='→ '+r.index+'번 뉴런 ('+prob+'%)';log('예측: '+r.index+' / '+prob+'%')}
function resetAI(){brain=new NeuralNetwork(layers);document.getElementById('epochText').textContent='0';document.getElementById('lossText').textContent='0';document.getElementById('prediction').textContent='-';log('신경망 초기화')}
document.getElementById('trainBtn').addEventListener('click',trainAI);document.getElementById('predictBtn').addEventListener('click',predictAI);document.getElementById('resetBtn').addEventListener('click',resetAI);checkServer();
