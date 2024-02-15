
export const allHelpType = [
  {
    title: '无技能\n性格:帮忙↓',
    skill: ['none'],
    character: 'hdown'
  },
  {
    title: '帮忙S\n性格:帮忙↓',
    skill: ['hs'],
    character: 'hdown'
  },
  {
    title: '无技能\n性格:无',
    skill: ['none'],
    character: 'none'
  },
  {
    title: '帮忙M\n性格:帮忙↓',
    skill: ['hm'],
    character: 'hdown'
  },
  {
    title: '帮忙S\n性格:无',
    skill: ['hs'],
    character: 'none'
  },
  {
    title: '帮忙M\n性格:无',
    skill: ['hm'],
    character: 'none'
  },
  {
    title: '无技能\n性格:帮忙↑',
    skill: ['none'],
    character: 'hup'
  },
  {
    title: '帮忙S,M\n性格:帮忙↓',
    skill: ['hs', 'hm'],
    character: 'hdown'
  },
  {
    title: '帮忙S\n性格:帮忙↑',
    skill: ['hs'],
    character: 'hup'
  },
  {
    title: '帮忙S,M\n性格:无',
    skill: ['hs', 'hm'],
    character: 'none'
  },
  {
    title: '帮忙M\n性格:帮忙↑',
    skill: ['hm'],
    character: 'hup'
  },
  {
    title: '帮忙S,M\n性格:帮忙↑',
    skill: ['hs', 'hm'],
    character: 'hup'
  }
]
export const skillOptions = [{
  label: 'hs',
  txt: '帮忙速度S(7%)'
}, {
  label: 'hm',
  txt: '帮忙速度M(14%)'
}, {
  label: 'fs',
  txt: '食材几率S(18%)'
}, {
  label: 'fm',
  txt: '食材几率M(36%)'
}]
export const characterOptions = [{
  label: 'none',
  txt: '无加成' // (害羞、勤奮、坦率、浮躁、認真)
}, {
  label: 'fdown',
  txt: '慎重、爽朗、淘氣(食↓+20%)'
}, {
  label: 'fup',
  txt: '慢吞吞、馬虎、冷靜(食↑+20%)'
}, {
  label: 'hdownfup',
  txt: '內斂(帮↓-10%食↑+20%)'
}, {
  label: 'hup',
  txt: '怕寂寞、頑皮、勇敢(帮↑+10%)'
}, {
  label: 'hupfdown',
  txt: '固執(帮↑+10%食↓-20%)'
}, {
  label: 'hdown',
  txt: '溫和、胆小、大膽(帮↓-10%)'
}]