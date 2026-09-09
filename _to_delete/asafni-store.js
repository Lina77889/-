/*
  اسعفني — طبقة مزامنة مشتركة تجريبية بين تطبيق المستجيب ولوحة المسعف.
  تعتمد على localStorage + حدث "storage" (يعمل بين تبويبات نفس المتصفح فورياً)
  حتى بدون خادم خلفي — مناسبة لعرض تكامل حي بين ملفين منفصلين في نموذج أولي.
  في النسخة النهائية المنشورة (نفس الدومين الحقيقي) يفضّل استبدالها بقاعدة بيانات
  لحظية حقيقية (Firebase / Supabase) بنفس الواجهة البرمجية (API) تقريباً.
*/
(function(global){
  const KEY='asafni_shared_cases_v1';
  const listeners={}; // caseId -> [callbacks]

  function readAll(){
    try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; }
  }
  function writeAll(all){
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  function getCase(id){
    const all=readAll();
    return all[id]||null;
  }

  function seedCase(id, initial){
    const all=readAll();
    if(!all[id]){
      all[id]=Object.assign({log:[], responder:null}, initial||{});
      writeAll(all);
    }
    return all[id];
  }

  function patchCase(id, patch){
    const all=readAll();
    const cur=all[id]||{log:[],responder:null};
    all[id]=Object.assign({}, cur, patch);
    writeAll(all);
    notify(id, all[id]);
    return all[id];
  }

  function pushLog(id, entry){
    const all=readAll();
    const cur=all[id]||{log:[],responder:null};
    const log=(cur.log||[]).concat([entry]);
    all[id]=Object.assign({}, cur, {log});
    writeAll(all);
    notify(id, all[id]);
    return all[id];
  }

  function subscribe(id, cb){
    if(!listeners[id])listeners[id]=[];
    listeners[id].push(cb);
    return function unsubscribe(){
      listeners[id]=(listeners[id]||[]).filter(f=>f!==cb);
    };
  }

  function notify(id, data){
    (listeners[id]||[]).forEach(cb=>{ try{ cb(data); }catch(e){ console.error(e); } });
  }

  // تحديثات قادمة من تبويب آخر (نفس المتصفح) عبر حدث storage القياسي
  global.addEventListener('storage', e=>{
    if(e.key!==KEY)return;
    const all=readAll();
    Object.keys(listeners).forEach(id=>{
      if(all[id])notify(id, all[id]);
    });
  });

  global.AsafniStore={getCase, seedCase, patchCase, pushLog, subscribe};
})(window);
