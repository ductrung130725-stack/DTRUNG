const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const url=require('url');

const PORT=process.env.PORT||3000;
const ADMIN_KEY=process.env.ADMIN_KEY||'Tranductrung123@';
const DATA_DIR=path.join(__dirname,'data');
const DB_FILE=path.join(DATA_DIR,'codes.json');
if(!fs.existsSync(DATA_DIR))fs.mkdirSync(DATA_DIR,{recursive:true});
if(!fs.existsSync(DB_FILE))fs.writeFileSync(DB_FILE,JSON.stringify({codes:{}},null,2));

function db(){return JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}
function save(x){fs.writeFileSync(DB_FILE,JSON.stringify(x,null,2))}
function json(res,status,obj){const b=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'});res.end(b)}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',x=>{s+=x;if(s.length>1e6)req.destroy()});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch(e){reject(e)}})})}
function admin(req){return req.headers['x-admin-key']===ADMIN_KEY}

function redeem(d,res){
 const code=String(d.code||'').trim().toUpperCase(), playerId=String(d.playerId||'').trim();
 if(!code||!playerId)return json(res,400,{ok:false,message:'Thiếu code hoặc player ID.'});
 const x=db(), c=x.codes[code];
 if(!c)return json(res,404,{ok:false,message:'Code không hợp lệ.'});
 c.usedBy=c.usedBy||[];
 if(c.usedBy.includes(playerId) && c.usedBy.filter(v=>v===playerId).length>=c.perPlayer)
   return json(res,409,{ok:false,message:'Bạn đã dùng hết lượt của code này.'});
 if((c.used||0)>=c.totalUses)return json(res,409,{ok:false,message:'Code đã hết lượt sử dụng.'});
 c.usedBy.push(playerId);c.used=(c.used||0)+1;save(x);
 const parts=[];if(c.coins)parts.push(c.coins+' xu');if(c.chaos)parts.push(c.chaos+' lượt Hỗn Chiến');
 return json(res,200,{ok:true,coins:c.coins||0,chaos:c.chaos||0,message:'Nhận thành công: '+parts.join(' + ')});
}

const server=http.createServer(async(req,res)=>{
 const u=url.parse(req.url,true);
 try{
  if(req.method==='POST'&&u.pathname==='/api/redeem')return redeem(await body(req),res);
  if(u.pathname.startsWith('/api/admin/')){
    if(!admin(req))return json(res,401,{message:'Sai ADMIN_KEY.'});
    const x=db();
    if(req.method==='GET'&&u.pathname==='/api/admin/codes'){
      const codes=Object.values(x.codes).map(c=>({code:c.code,coins:c.coins||0,chaos:c.chaos||0,used:c.used||0,totalUses:c.totalUses}));
      return json(res,200,{codes});
    }
    if(req.method==='POST'&&u.pathname==='/api/admin/codes'){
      const d=await body(req),code=String(d.code||'').trim().toUpperCase();
      if(!/^[A-Z0-9_-]{3,32}$/.test(code))return json(res,400,{message:'Code chỉ dùng A-Z, 0-9, _ hoặc - và dài 3-32 ký tự.'});
      const coins=Math.max(0,Math.floor(+d.coins||0)),chaos=Math.max(0,Math.floor(+d.chaos||0));
      if(!coins&&!chaos)return json(res,400,{message:'Code phải có phần thưởng.'});
      if(x.codes[code])return json(res,409,{message:'Code đã tồn tại.'});
      x.codes[code]={code,coins,chaos,perPlayer:Math.max(1,Math.floor(+d.perPlayer||1)),totalUses:Math.max(1,Math.floor(+d.totalUses||100)),used:0,usedBy:[],createdAt:new Date().toISOString()};
      save(x);return json(res,200,{message:'Đã tạo '+code});
    }
    if(req.method==='DELETE'&&u.pathname.startsWith('/api/admin/codes/')){
      const code=decodeURIComponent(u.pathname.split('/').pop()).toUpperCase();
      if(!x.codes[code])return json(res,404,{message:'Không tìm thấy code.'});
      delete x.codes[code];save(x);return json(res,200,{message:'Đã xóa '+code});
    }
  }
  let file=u.pathname==='/'?'/index.html':u.pathname;
  if(file==='/admin')file='/admin.html';
  const full=path.join(__dirname,'public',path.normalize(file).replace(/^(\.\.[\/\\])+/,'')); 
  if(!full.startsWith(path.join(__dirname,'public')))return json(res,403,{message:'Forbidden'});
  if(!fs.existsSync(full)||fs.statSync(full).isDirectory())return json(res,404,{message:'Not found'});
  const ext=path.extname(full),types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
  res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});fs.createReadStream(full).pipe(res);
 }catch(e){console.error(e);json(res,500,{message:'Server error.'})}
});
server.listen(PORT,()=>console.log(`DTRUNG server: http://localhost:${PORT} | admin: http://localhost:${PORT}/admin`));
