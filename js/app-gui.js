var menuFont = {
  size: '14px',
  family: 'Arial'
}

var menuScreenJSON = {
  id: 'menu',
  component: 'Window',
  padding: 0,
  position: { x: 0, y: 0 },
  width: 1024,
  height: 512,

  layout: [1,2],
  children: [
    {
      text: 'NAMETBD',
      font: {
        size: '20px',
        family: 'Arial Black',
        color: '#808090'
      },
      component: 'Header',

      position: 'center',

      width: 1024,
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
        { id: 'playBtn', font: { size: '18px', family: 'Arial' }, text: 'START', component: 'Button', position: 'center', width: 120, height: 50 },
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
  width: 150,
  height: 30,

  layout: [2,1],
  children: [
    { id: 'quitBtn', font: menuFont, text: 'quit', component: 'Button', position: 'center', width: 50, height: 25 },
    { id: 'settingsBtn', font: menuFont, text: 'settings', component: 'Button', position: 'center', width: 75, height: 25 }
  ]
}

var settingsScreenJSON = {
  id: 'settings',
  component: 'Window',
  padding: 0,
  position: { x: 250, y: 100 },
  width: 200,
  height: 75,

  layout: [2,3],
  children: [
    { id: 'nickField', font: menuFont, text: 'Player', component: 'Input', position: 'left', width: 200, height: 25 },
    null,
    null,
    { id: 'nickBtn', font: menuFont, text: 'set name', component: 'Button', position: 'right', width: 100, height: 25 },
    null,
    { id: 'closeSettingsBtn', font: menuFont, text: 'close', component: 'Button', position: 'right', width: 75, height: 25 }
  ]
}

var chatBoxJSON = {
  id: 'chatBox',
  component: 'Layout',
  padding: 0,
  position: { x: 0, y: 412 }, // game height - 100
  width: 400,
  height: 100,

  layout: [2,1],
  children: [
    { id: 'chatlog', font: menuFont, text: 'Welcome to NAMETBD!', component: 'Layout', position: 'center', width: 400, height: 75 },
    { id: 'chatInput', font: { size: '18px', family: 'Arial' }, component: 'Input', position: 'left', width: 400, height: 25 }
  ]
}
