
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApi } from "../../hooks/useApi.js";
import Toggle from "../../components/Toggle.jsx";

const ALL_EMOJIS = [
  {e:"📊",l:"Charts"},{e:"💰",l:"Money"},{e:"✅",l:"Done"},{e:"⚠️",l:"Warning"},{e:"🎯",l:"Target"},
  {e:"🔥",l:"Hot"},{e:"🚀",l:"Launch"},{e:"📰",l:"News"},{e:"🏆",l:"Win"},{e:"⏰",l:"Time"}
];

export default function StyleEmoji() {
  const { user, refreshUser } = useAuth();
  const { patch } = useApi();
  const [settings, setSettings] = useState({});
  const [customEmoji, setCustomEmoji] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (user) { setSettings(user); setCustomEmoji((user.custom_emojis||[]).join(" ")); } }, [user]);
  function set(key, val) { setSettings(s=>({...s,[key]:val})); }

  function toggleEmoji(emoji) {
    const list = settings.approved_emojis || [];
    set("approved_emojis", list.includes(emoji) ? list.filter(e=>e!==emoji) : [...list, emoji]);
  }

  async function save() {
    await patch("/api/firm/settings", {...settings, custom_emojis: customEmoji.split(" ").filter(Boolean)});
    refreshUser(); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Style & emoji</h1>
        <button className="btn btn-primary btn-sm" onClick={save}>{saved?"Saved ✓":"Save settings"}</button>
      </div>

      <div className="card">
        <div className="card-title"><i className="ti ti-palette" />Tone</div>
        <div className="row">
          <div className="row-label"><div className="lbl">Formality</div></div>
          <select className="select" style={{width:140}} value={settings.tone||"professional"} onChange={e=>set("tone",e.target.value)}>
            <option value="casual">Casual</option><option value="professional">Professional</option><option value="formal">Formal</option>
          </select>
        </div>
        <div className="row">
          <div className="row-label"><div className="lbl">Response length</div></div>
          <select className="select" style={{width:140}} value={settings.response_length||"balanced"} onChange={e=>set("response_length",e.target.value)}>
            <option value="short">Short</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option>
          </select>
        </div>
        <div className="row"><div className="row-label"><div className="lbl">Use emojis</div></div><Toggle value={settings.use_emojis} onChange={v=>set("use_emojis",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Bold key numbers and rules</div></div><Toggle value={settings.bold_key_info} onChange={v=>set("bold_key_info",v)} /></div>
        <div className="row"><div className="row-label"><div className="lbl">Bot display name</div></div><input className="input" style={{width:160}} value={settings.bot_name||""} onChange={e=>set("bot_name",e.target.value)} /></div>
      </div>

      <div className="card">
        <div className="card-title"><i className="ti ti-mood-smile" />Approved emojis</div>
        <div className="emoji-grid">
          {ALL_EMOJIS.map(({e,l}) => (
            <div key={e} className={"emoji-cell"+((settings.approved_emojis||[]).includes(e)?" selected":"")} onClick={()=>toggleEmoji(e)}>
              <div className="emoji-icon">{e}</div><div className="emoji-label">{l}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:10}}>
          <label style={{fontSize:11,color:"var(--text2)",display:"block",marginBottom:5}}>Custom Discord server emojis (space-separated)</label>
          <input className="input" placeholder=":yourfirm_logo: :verified: :custom_emoji:" value={customEmoji} onChange={e=>setCustomEmoji(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
