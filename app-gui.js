var menuScreenJSON = {
  id: 'menu',
  component: 'Window',
  padding: 0,
  position: { x: 0, y: 0 },
  width: 1000,
  height: 600,

  layout: [1,2],
  children: [
    {
      text: 'MASQUE',
      font: {
        size: '20px',
        family: 'Arial Black',
        color: '#c00000'
      },
      component: 'Header',

      position: 'center',

      width: 1000,
      height: 300
    },
    {
      component: 'Header',

      // z: 1, // necessary for navbar because of PIXI event handling

      padding: 3,
      position: 'center',
      width: 400,
      height: 60,
      layout: [3,1],
      children: [
        null,
        { id: 'playBtn', text: 'START', component: 'Button', position: 'center', width: 120, height: 50 },
        null
      ]
    }
  ]
}

var gameScreenJSON = {
  id: 'hud',
  component: 'Window',
  padding: 0,
  position: { x: 0, y: 0 },
  width: 1000,
  height: 50,

  layout: [8,1],
  children: [
    { id: 'quitBtn', text: 'QUIT', component: 'Button', position: 'center', width: 75, height: 50 },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]
}
