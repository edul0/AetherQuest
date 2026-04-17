// ... resto do seu código acima (não mude nada lá em cima)

  const lines = [];
  // Grid mais sutil e pontilhado para ficar elegante
  for (let i = 0; i < windowSize.w / GRID_SIZE; i++) {
    lines.push(<Line key={`v-${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, windowSize.h]} stroke="#4ad9d9" strokeWidth={1} opacity={0.15} dash={[4, 4]} />);
  }
  for (let j = 0; j < windowSize.h / GRID_SIZE; j++) {
    lines.push(<Line key={`h-${j}`} points={[0, j * GRID_SIZE, windowSize.w, j * GRID_SIZE]} stroke="#4ad9d9" strokeWidth={1} opacity={0.15} dash={[4, 4]} />);
  }

  return (
    <div className="fixed inset-0 bg-[#090e17] overflow-hidden -z-10">
      <Stage width={windowSize.w} height={windowSize.h} draggable>
        <Layer>
          {/* Se tiver imagem, mostra a imagem. Se não tiver, avisa o Mestre */}
          {image ? (
            <KonvaImage image={image} width={image.width} height={image.height} />
          ) : (
            <import_react_konva.Text 
               x={20} 
               y={80} 
               text="Vazio. Use os controles abaixo para fazer upload do mapa desta cena." 
               fontSize={16} 
               fill="#6b7b94" 
               fontFamily="monospace"
            />
          )}
          
          {lines}
          
          {tokens.map(t => (
            <Circle
              key={t.id}
              x={t.x + GRID_SIZE / 2}
              y={t.y + GRID_SIZE / 2}
              radius={GRID_SIZE * 0.4}
              fill={t.cor || '#ef4444'}
              draggable
              onDragEnd={(e) => handleDragEnd(t.id, e)}
              shadowBlur={10}
              shadowColor={t.cor || '#ef4444'}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
