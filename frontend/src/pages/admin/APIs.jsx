
import React from "react";

const APIS = [
  { name:"Anthropic API", badge:"Required · AI brain", desc:"Powers all AI responses, knowledge base, conflict detection, interviewer. Get at console.anthropic.com", code:"ANTHROPIC_API_KEY=sk-ant-api03-...", cost:"~$0.003/1k tokens", costColor:"var(--g)" },
  { name:"Supabase", badge:"Required · Database", desc:"All firm data, conversations, embeddings, vector search. supabase.com", code:"SUPABASE_URL=https://xxx.supabase.co\nSUPABASE_SERVICE_KEY=eyJ...", cost:"Free tier: 500MB", costColor:"var(--g)" },
  { name:"Flutterwave", badge:"Required · Payments", desc:"All subscriptions, billing, trials, cards. Works for Nigerian-registered businesses, accepts payment worldwide. dashboard.flutterwave.com", code:"FLW_SECRET_KEY=FLWSECK-...\nFLW_WEBHOOK_HASH=...", cost:"~1.4% per transaction", costColor:"var(--a)" },
  { name:"OpenAI embeddings", badge:"Required · RAG", desc:"Converts docs to vectors for AI search. platform.openai.com", code:"OPENAI_API_KEY=sk-...", cost:"~$0.0001/1k tokens", costColor:"var(--g)" },
  { name:"Discord Bot API", badge:"Platform", desc:"discord.com/developers/applications → New App → Bot → copy token.", code:"DISCORD_BOT_TOKEN=MTA...\nDISCORD_CLIENT_ID=123...", cost:"Free", costColor:"var(--g)" },
  { name:"Resend", badge:"Email delivery", desc:"Transactional emails. resend.com — 3,000 free/month.", code:"RESEND_API_KEY=re_...", cost:"Free to start", costColor:"var(--g)" },
  { name:"Twilio", badge:"Optional", desc:"WhatsApp + SMS. Requires Meta Business approval. twilio.com", code:"TWILIO_ACCOUNT_SID=AC...\nTWILIO_AUTH_TOKEN=...\nTWILIO_WHATSAPP_FROM=whatsapp:+1415...", cost:"~$0.005/msg", costColor:"var(--a)" },
  { name:"Telegram BotFather", badge:"Optional", desc:"Create at @BotFather on Telegram — free.", code:"TELEGRAM_BOT_TOKEN=1234567:ABC...", cost:"Free", costColor:"var(--g)" },
];

export default function AdminAPIs() {
  return (
    <div>
      <div className="page-header"><h1 className="page-title">APIs you need</h1></div>
      {APIS.map(api => (
        <div key={api.name} className="api-box">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div className="api-box-name">{api.name}</div>
            <span className="badge badge-red">{api.badge}</span>
          </div>
          <div className="api-box-desc">{api.desc}</div>
          <div className="code-block">{api.code.split("\\n").map((l,i)=><div key={i}>{l}</div>)}</div>
          <div style={{fontSize:11,color:api.costColor,marginTop:6}}>{api.cost}</div>
        </div>
      ))}
    </div>
  );
}
