
import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi.js";
import Badge from "../../components/Badge.jsx";

const PLATFORMS = [
  { id:"discord", name:"Discord", icon:"ti-brand-discord", color:"#5865F2", desc:"Auto-detects all channels · threading · slash commands",
    fields:[{key:"discord_bot_token",label:"Bot token",placeholder:"MTA..."},{key:"discord_guild_id",label:"Server ID",placeholder:"123456789"}],
    steps:["Go to discord.com/developers/applications → New Application","Bot tab → Add Bot → copy token above","OAuth2 → URL Generator → bot + Send Messages, Read History, Add Reactions → invite to server","BotPip auto-detects all your channels after connection"]
  },
  { id:"website", name:"Website widget", icon:"ti-world", color:"#7F77DD", desc:"1 script tag · proactive triggers · custom colour",
    code:'<script src="https://botpip.io/widget.js" data-id="YOUR_FIRM_ID"></script>',
    steps:["Copy the script tag above","Paste it before </body> on your website","Works with WordPress, Webflow, Framer, raw HTML","Widget appears in bottom-right corner automatically"]
  },
  { id:"intercom", name:"Intercom", icon:"ti-headset", color:"#1F8DED", desc:"AI agent + agent assist mode",
    fields:[{key:"intercom_access_token",label:"Access token",placeholder:"dG9rZW4..."}],
    steps:["Intercom → Settings → Developers → Your App → Access Token","Developers → Webhooks → add URL: https://botpip.io/webhooks/intercom/YOUR_ID","Select: conversation.user.created + conversation.user.replied"]
  },
  { id:"zendesk", name:"Zendesk", icon:"ti-ticket", color:"#17494D", desc:"Auto-resolve tickets · agent assist",
    fields:[{key:"zendesk_subdomain",label:"Subdomain",placeholder:"yourfirm"},{key:"zendesk_email",label:"Admin email",placeholder:"admin@..."},{key:"zendesk_api_token",label:"API token",placeholder:"..."}],
    steps:["Admin Centre → Apps & Integrations → Zendesk API → Add Token","Admin → Triggers → New → When ticket created → Notify webhook: https://botpip.io/webhooks/zendesk/YOUR_ID"]
  },
  { id:"telegram", name:"Telegram", icon:"ti-brand-telegram", color:"#229ED9", desc:"Group bot · voice messages · threading",
    fields:[{key:"telegram_bot_token",label:"Bot token",placeholder:"1234567:ABC..."}],
    steps:["Open Telegram → search @BotFather → /newbot → follow prompts","Copy your bot token above","Add bot to your group as admin","BotPip replies in thread to every message"]
  },
  { id:"whatsapp", name:"WhatsApp", icon:"ti-brand-whatsapp", color:"#25D366", desc:"Meta Business API · approved templates",
    fields:[{key:"whatsapp_phone_number_id",label:"Phone Number ID",placeholder:"1234..."},{key:"whatsapp_access_token",label:"Access token",placeholder:"EAABs..."}],
    steps:["Apply at business.facebook.com → WhatsApp → Get Started (1–5 day review)","Meta Business Suite → WhatsApp → API Setup → copy Phone Number ID + token","Set webhook: https://botpip.io/webhooks/whatsapp/YOUR_ID"]
  },
  { id:"slack", name:"Slack", icon:"ti-brand-slack", color:"#4A154B", desc:"Channel bot · thread replies",
    fields:[{key:"slack_bot_token",label:"Bot token",placeholder:"xoxb-..."}],
    steps:["api.slack.com/apps → Create New App → From Scratch","OAuth & Permissions → Bot Scopes: channels:read, chat:write, im:history → Install","Event Subscriptions webhook: https://botpip.io/webhooks/slack/YOUR_ID"]
  },
];

export default function Integrations() {
  const { get, post, del } = useApi();
  const [connections, setConnections] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { get("/api/integrations").then(setConnections).catch(()=>{}); }, []);

  const getConn = id => connections.find(c=>c.platform===id);

  async function connect(platformId) {
    setSaving(platformId); setMsg("");
    try {
      await post("/api/integrations/"+platformId, formData[platformId]||{});
      const updated = await get("/api/integrations");
      setConnections(updated);
      setExpanded(null);
      setMsg(platformId+" connected successfully!");
    } catch(err) { setMsg("Error: "+err.message); }
    finally { setSaving(null); }
  }

  async function disconnect(platformId) {
    if (!confirm("Disconnect "+platformId+"?")) return;
    await del("/api/integrations/"+platformId);
    const updated = await get("/api/integrations");
    setConnections(updated);
  }

  function setField(platform, key, value) {
    setFormData(f=>({...f,[platform]:{...(f[platform]||{}),[key]:value}}));
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Integration hub</h1>
        <span style={{fontSize:11,color:"var(--text2)"}}>Click "How to connect" for step-by-step setup</span>
      </div>

      {msg && <div style={{background:"var(--gl)",color:"var(--gt)",padding:"8px 12px",borderRadius:6,fontSize:12,marginBottom:12}}>{msg}</div>}

      <div className="card" style={{padding:0}}>
        {PLATFORMS.map((plat, i) => {
          const conn = getConn(plat.id);
          const isConnected = conn?.status === "connected";
          const isOpen = expanded === plat.id;

          return (
            <div key={plat.id}>
              <div className="plat-row" style={{padding:"10px 16px", borderBottom: isOpen||i===PLATFORMS.length-1?"none":"1px solid var(--border)"}}>
                <div className="plat-icon" style={{background:plat.color}}><i className={"ti "+plat.icon} /></div>
                <div style={{flex:1}}>
                  <div className="plat-name">{plat.name}</div>
                  <div className="plat-sub">{plat.desc}</div>
                </div>
                {isConnected
                  ? <button className="conn-btn conn-btn-on"><i className="ti ti-check" style={{fontSize:12}} />Connected</button>
                  : <button className="conn-btn conn-btn-off" onClick={()=>setExpanded(isOpen?null:plat.id)}>{isOpen?"Close":"How to connect"}</button>
                }
                {isConnected && <button className="btn btn-ghost btn-sm" onClick={()=>disconnect(plat.id)}><i className="ti ti-x" /></button>}
              </div>

              {isOpen && (
                <div style={{padding:"0 16px 16px",borderBottom:"1px solid var(--border)",background:"var(--bg)"}}>
                  <div className="step-list" style={{marginBottom:12}}>
                    {plat.steps.map((s,si) => (
                      <div key={si} className="step-item">
                        <div className="step-num">{si+1}</div>
                        <div>{s}</div>
                      </div>
                    ))}
                  </div>

                  {plat.code && <div className="code-block" style={{marginBottom:10,userSelect:"all"}}>{plat.code}</div>}

                  {plat.fields && (
                    <div style={{marginBottom:12}}>
                      {plat.fields.map(f => (
                        <div key={f.key} style={{marginBottom:8}}>
                          <label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:4}}>{f.label}</label>
                          <input className="input" placeholder={f.placeholder} value={(formData[plat.id]||{})[f.key]||""} onChange={e=>setField(plat.id,f.key,e.target.value)} />
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="btn btn-primary btn-sm" onClick={()=>connect(plat.id)} disabled={saving===plat.id}>
                    {saving===plat.id?"Connecting...":"Save & connect"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
