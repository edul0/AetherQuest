<!DOCTYPE html>
<html>
<head>
  <title>MesaQuest Mobile-First</title>
  <script src="https://unpkg.com/konva@9/konva.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    body { margin: 0; background: #0f172a; overflow: hidden; }
    #controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10; }
    button { padding: 15px 25px; border-radius: 30px; border: none; bg: #ef4444; color: white; font-weight: bold; }
  </style>
</head>
<body>
  <div id="controls">
    <button onclick="rollDice()">🎲 Rolar D20</button>
  </div>
  <div id="container"></div>

  <script>
    // 1. Configurações do Supabase (Pegue no painel do seu projeto)
    const SB_URL = "SUA_URL_AQUI";
    const SB_KEY = "SUA_ANON_KEY_AQUI";
    const supabase = lib.createClient(SB_URL, SB_KEY);

    // 2. Setup do Canvas (Konva)
    const stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: true // Mestre arrasta o mapa
    });
    const layer = new Konva.Layer();
    stage.add(layer);

    // 3. O Token (Monstro)
    const circle = new Konva.Circle({
      x: 150, y: 150, radius: 30, fill: 'red', draggable: true
    });
    layer.add(circle);

    // 4. Sincronização: Enviar movimento (Mestre no Celular)
    circle.on('dragend', async () => {
      const { data, error } = await supabase
        .from('tokens')
        .update({ x: circle.x(), y: circle.y() })
        .eq('nome', 'Orc'); // Exemplo
    });

    // 5. Sincronização: Receber movimento (Você no PC)
    supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tokens' }, payload => {
        circle.to({
          x: payload.new.x,
          y: payload.new.y,
          duration: 0.1
        });
      })
      .subscribe();

    function rollDice() {
      alert("Resultado: " + (Math.floor(Math.random() * 20) + 1));
    }
  </script>
</body>
</html>
