<script setup>
import { ref, watch, onMounted } from 'vue'
import CptEnergyItem from '../components/CptEnergy/EnergyItem.vue'
import { sortInObjectOptions, toHM } from '../utils/index.js'
import { getOneDayEnergy, getOneDayHelpCount } from '../utils/energy.js'
import { pokedex } from '../config/pokedex.js'
import { FOOD_TYPES } from '../config/valKey.js'
import { NAV_HELPSPEEDCALC } from '../config/nav.js'
import {
  allHelpType,
  skillOptions,
  characterOptions,
  skillOptionsExtra,
  skillOptionsExtra2,
  levelOptions
} from '../config/helpSpeed.js'

import i18n from '../i18n'
const { t } = i18n.global

const navData = ref(NAV_HELPSPEEDCALC)
const byHelpSpeedRes = ref([])
const targetInList = ref([])
const otherLevelShow = [25, 30, 50, 60, 100]
const helpSpeedCalcForm = ref({
  pokemonId: 26,
  baseHelpSpeed: 2200, // Number
  level: 50, // Number
  isUseTicket: false, // Boolean: true/false
  isRightBerry: false, // Boolean: true/false
  skill: ['none'], // Array: ['none', 'hs', 'hm', 'fs', 'fm', 'hg1', 'hg2', 'hg3', 'hg4', 'hg5']
  character: 'none', // String: none, hdown, hup, fdown, fup, hdownfup, hupfdown
  useFoods: [0, 0, 0],
  rankIndex: 1,
  resLength: 0,
  contrastPoke: null
})
const userPokemons = ref({
  list: []
})
// 获取选择帮忙速度的宝可梦分组
const initFilterGroup = () => {
  let byHelpSpeedResIn = []
  const byHelpSpeedOrgList = []
  for (const pokeKey in pokedex) {
    if (Object.hasOwnProperty.call(pokedex, pokeKey)) {
      const pokedexItem = pokedex[pokeKey]

      // 帮忙速度分类
      if (
        pokedexItem.helpSpeed &&
        !byHelpSpeedOrgList.includes(pokedexItem.helpSpeed)
      ) {
        byHelpSpeedResIn.push({
          id: pokedexItem.helpSpeed,
          helpSpeed: pokedexItem.helpSpeed,
          title: `${pokedexItem.helpSpeed}s`,
          list: []
        })
        byHelpSpeedOrgList.push(pokedexItem.helpSpeed)
      }
      byHelpSpeedResIn
        .find(item => item.helpSpeed === pokedexItem.helpSpeed)
        .list.push(pokedexItem)
    }
  }
  byHelpSpeedResIn.forEach(item => {
    item.count = item.list.length
    item.list = sortInObjectOptions(
      [...item.list],
      ['pokeType', 'berryType', 'id'],
      'up'
    )
  })
  byHelpSpeedResIn = sortInObjectOptions(byHelpSpeedResIn, ['helpSpeed'], 'up')
  byHelpSpeedResIn.forEach((item, key) => {
    item.sortIndex = key + 1
  })
  return byHelpSpeedResIn
}

// 获取计算结果
const getNewHelpSpeed = (formData, level) => {
  // console.log(formData, level)
  // formData: {
  //   baseHelpSpeed, // Number
  //   skill, // Array: ['none', 'hs', 'hm', 'fs', 'fm', 'hg1', 'hg2', 'hg3', 'hg4', 'hg5']
  //   character // String: none, hdown, hup, fdown, fup, hdownfup, hupfdown
  // }
  // 每级多0.2%
  const levelUp = (level - 1) * 0.002
  let basichelp = 0
  let mainMuti = 0
  if (formData.skill.includes('hs')) {
    basichelp += 0.07
  }
  if (formData.skill.includes('hm')) {
    basichelp += 0.14
  }
  if (formData.character.indexOf('hup') > -1) {
    mainMuti = 0.1
  }
  if (formData.character.indexOf('hdown') > -1) {
    mainMuti = -0.1
  }
  if (formData.skill.includes('hg1')) {
    basichelp += 0.05
  }
  if (formData.skill.includes('hg2')) {
    basichelp += 0.05 * 2
  }
  if (formData.skill.includes('hg3')) {
    basichelp += 0.05 * 3
  }
  if (formData.skill.includes('hg4')) {
    basichelp += 0.05 * 4
  }
  if (formData.skill.includes('hg5')) {
    basichelp += 0.05 * 5
  }
  if (basichelp >= 0.35) {
    // 所有帮忙技能加起来不能大于35%
    basichelp = 0.35
  }
  let res = Math.floor(
    (Math.floor((1 - mainMuti) * (1 - basichelp) * (1 - levelUp) * 10000) /
      10000) *
      formData.baseHelpSpeed
  )
  if (helpSpeedCalcForm.value.isUseTicket) {
    res = Math.floor(res / 1.2)
  }
  return res
}

const getNewFoodPer = (formData, foodPer) => {
  foodPer = foodPer || 0
  let basicfood = 0
  let mainMuti = 0
  if (formData.skill.includes('fs')) {
    basicfood += 0.18
  }
  if (formData.skill.includes('fm')) {
    basicfood += 0.36
  }
  if (formData.character.indexOf('fup') > -1) {
    mainMuti = 0.2
  }
  if (formData.character.indexOf('fdown') > -1) {
    mainMuti = -0.2
  }
  return Math.floor(foodPer * ((1 + basicfood) * (1 + mainMuti)) * 1000) / 1000
}

const getNewSkillPer = (formData, skillPer) => {
  skillPer = skillPer || 0
  let basicsKill = 0
  let mainMuti = 0
  if (formData.skill.includes('ss')) {
    basicsKill += 0.18
  }
  if (formData.skill.includes('sm')) {
    basicsKill += 0.36
  }
  if (formData.character.indexOf('sup') > -1) {
    mainMuti = 0.2
  }
  if (formData.character.indexOf('sdown') > -1) {
    mainMuti = -0.2
  }
  return (
    Math.floor(skillPer * ((1 + basicsKill) * (1 + mainMuti)) * 1000) / 1000
  )
}

const addArrInOptions = (extraDesc, pokeItem, isPlayer) => {
  const pokeLevel = pokeItem.level || helpSpeedCalcForm.value.level
  const pokeUseFoods = pokeItem.useFoods || helpSpeedCalcForm.value.useFoods
  const pokeUseSkill = pokeItem.skill || helpSpeedCalcForm.value.skill
  const newPokeItem = { ...pokeItem }
  newPokeItem.oneDayHelpCount = getOneDayHelpCount(
    newPokeItem.helpSpeed,
    newPokeItem.foodPer,
    newPokeItem.skillPer
  )

  const resRankArr = []
  let tempFoodType = [
    [0, 0],
    [0, 1]
  ]
  if (pokeLevel < 30) {
    tempFoodType = [[0]]
  } else if (pokeLevel >= 60) {
    if (pokeItem.food.type.length === 3) {
      tempFoodType = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 0, 2],
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 2]
      ]
    } else {
      tempFoodType = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
        [0, 1, 1]
      ]
    }
  }

  if (isPlayer) {
    tempFoodType = [[...pokeUseFoods]]
    if (pokeLevel >= 30 && pokeLevel < 60) {
      tempFoodType[0].splice(2, 1)
    } else if (pokeLevel < 30) {
      tempFoodType = [[0]]
    }
    // console.log(pokeUseFoods, tempFoodType)
  } else {
    const nArr = []
    for (let i = 0; i < tempFoodType.length; i++) {
      nArr.push(tempFoodType[i], tempFoodType[i])
    }
    tempFoodType = nArr
  }

  tempFoodType.forEach((arrFTItem, arrFTKey) => {
    let is2n = (arrFTKey + 1) % 2 === 0
    if (isPlayer) {
      is2n = pokeUseSkill.includes('berrys')
    }

    let arrFood = []
    if (newPokeItem.food) {
      arrFood = [
        newPokeItem.food.type[arrFTItem[0]],
        newPokeItem.food.type[arrFTItem[1]]
      ]
      if (pokeLevel < 30) {
        arrFood.splice(1, arrFood.length)
      } else if (pokeLevel >= 60) {
        arrFood.push(newPokeItem.food.type[arrFTItem[2]])
      }
    }
    resRankArr.push({
      ...newPokeItem,
      id: newPokeItem.id,
      nameExtra: is2n ? t('SHORT_SKILL.berrys') : '',
      extraDesc: extraDesc,
      ...getOneDayEnergy(
        newPokeItem,
        pokeLevel,
        arrFood,
        is2n ? true : false,
        helpSpeedCalcForm.value.isRightBerry
      )
    })
  })
  return resRankArr
}

const getPlayerExtraDesc = pokemons => {
  let extraDesc = '自选'
  if (pokemons.skill.includes('hs') || pokemons.skill.includes('hm')) {
    extraDesc += '\n'
  }
  if (pokemons.skill.includes('hs')) {
    extraDesc += '帮忙S'
  }
  if (pokemons.skill.includes('hs') && pokemons.skill.includes('hm')) {
    extraDesc += ','
  }
  if (pokemons.skill.includes('hm')) {
    extraDesc += '帮忙M'
  }
  if (pokemons.skill.includes('hg1')) {
    extraDesc += '\n帮手奖励*1'
  }
  if (pokemons.skill.includes('hg2')) {
    extraDesc += '\n帮手奖励*2'
  }
  if (pokemons.skill.includes('hg3')) {
    extraDesc += '\n帮手奖励*3'
  }
  if (pokemons.skill.includes('hg4')) {
    extraDesc += '\n帮手奖励*4'
  }
  if (pokemons.skill.includes('hg5')) {
    extraDesc += '\n帮手奖励*5'
  }
  if (pokemons.skill.includes('fs') || pokemons.skill.includes('fm')) {
    extraDesc += '\n'
  }
  if (pokemons.skill.includes('fs')) {
    extraDesc += '食率S'
  }
  if (pokemons.skill.includes('fs') && pokemons.skill.includes('fm')) {
    extraDesc += ','
  }
  if (pokemons.skill.includes('fm')) {
    extraDesc += '食率M'
  }
  if (pokemons.skill.includes('ss') || pokemons.skill.includes('sm')) {
    extraDesc += '\n'
  }
  if (pokemons.skill.includes('ss')) {
    extraDesc += '技率S'
  }
  if (pokemons.skill.includes('ss') && pokemons.skill.includes('sm')) {
    extraDesc += ','
  }
  if (pokemons.skill.includes('sm')) {
    extraDesc += '技率M'
  }
  extraDesc += `\n${
    characterOptions.find(item => item.label === pokemons.character).txt
  }`
  return extraDesc
}

const getTargetPokemonEnergy = pokeId => {
  let resRankArr = []
  const pokeItem = { ...pokedex[pokeId] }
  pokeItem.helpSpeed = getNewHelpSpeed(
    helpSpeedCalcForm.value,
    helpSpeedCalcForm.value.level
  )
  pokeItem.foodPer = getNewFoodPer(helpSpeedCalcForm.value, pokeItem.foodPer)
  pokeItem.skillPer = getNewSkillPer(
    helpSpeedCalcForm.value,
    pokeItem.skillPer
  )

  resRankArr = resRankArr.concat(
    addArrInOptions(getPlayerExtraDesc(helpSpeedCalcForm.value), pokeItem, true)
  ) // 玩家自选

  const hsDefaultOptions = {
    skill: ['none'], // Array: ['none', 'hs', 'hm', 'fs', 'fm', 'hg1', 'hg2', 'hg3', 'hg4', 'hg5']
    character: 'none' // String: none, hdown, hup, fdown, fup, hdownfup, hupfdown
  }

  if (helpSpeedCalcForm.value.contrastPoke) {
    const tempPokeItem = { ...pokedex[helpSpeedCalcForm.value.contrastPoke] }
    tempPokeItem.helpSpeed = getNewHelpSpeed(
      {
        baseHelpSpeed: tempPokeItem.helpSpeed,
        ...hsDefaultOptions
      },
      helpSpeedCalcForm.value.level
    )
    resRankArr = resRankArr.concat(addArrInOptions('对比白板', tempPokeItem))
  }

  const tempPokeItem = { ...pokedex[pokeId] }
  tempPokeItem.helpSpeed = getNewHelpSpeed(
    {
      baseHelpSpeed: tempPokeItem.helpSpeed,
      ...hsDefaultOptions
    },
    helpSpeedCalcForm.value.level
  )
  resRankArr = resRankArr.concat(addArrInOptions('白板', tempPokeItem))

  const tempPokeItem2 = { ...pokedex[pokeId] }
  const tempSCOptions2 = {
    skill: ['fs', 'fm'], // Array: ['none', 'hs', 'hm', 'fs', 'fm', 'hg1', 'hg2', 'hg3', 'hg4', 'hg5']
    character: 'hup' // String: none, hdown, hup, fdown, fup, hdownfup, hupfdown
  }
  tempPokeItem2.helpSpeed = getNewHelpSpeed(
    {
      baseHelpSpeed: tempPokeItem2.helpSpeed,
      ...tempSCOptions2
    },
    helpSpeedCalcForm.value.level
  )
  tempPokeItem2.foodPer = getNewFoodPer(
    {
      ...tempSCOptions2
    },
    tempPokeItem2.foodPer
  )
  pokeItem.skillPer = getNewSkillPer(
    {
      ...tempSCOptions2
    },
    tempPokeItem2.skillPer
  )
  resRankArr = resRankArr.concat(
    addArrInOptions('食材S,M\n性格:帮忙↑', tempPokeItem2)
  )

  const tempPokeItem3 = { ...pokedex[pokeId] }
  const tempSCOptions3 = {
    skill: ['hs', 'hm'], // Array: ['none', 'hs', 'hm', 'fs', 'fm', 'hg1', 'hg2', 'hg3', 'hg4', 'hg5']
    character: 'hupfdown' // String: none, hdown, hup, fdown, fup, hdownfup, hupfdown
  }
  tempPokeItem3.helpSpeed = getNewHelpSpeed(
    {
      baseHelpSpeed: tempPokeItem3.helpSpeed,
      ...tempSCOptions3
    },
    helpSpeedCalcForm.value.level
  )
  tempPokeItem3.foodPer = getNewFoodPer(
    {
      ...tempSCOptions3
    },
    tempPokeItem3.foodPer
  )
  pokeItem.skillPer = getNewSkillPer(
    {
      ...tempSCOptions3
    },
    tempPokeItem3.skillPer
  )
  resRankArr = resRankArr.concat(
    addArrInOptions('帮忙S,M\n性格:固执', tempPokeItem3)
  )

  const tempPokeItem4 = { ...pokedex[pokeId] }
  const tempSCOptions4 = {
    skill: ['fs', 'fm'], // Array: ['none', 'hs', 'hm', 'fs', 'fm', 'hg1', 'hg2', 'hg3', 'hg4', 'hg5']
    character: 'fup' // String: none, hdown, hup, fdown, fup, hdownfup, hupfdown
  }
  tempPokeItem4.helpSpeed = getNewHelpSpeed(
    {
      baseHelpSpeed: tempPokeItem4.helpSpeed,
      ...tempSCOptions4
    },
    helpSpeedCalcForm.value.level
  )
  tempPokeItem4.foodPer = getNewFoodPer(
    {
      ...tempSCOptions4
    },
    tempPokeItem4.foodPer
  )
  pokeItem.skillPer = getNewSkillPer(
    {
      ...tempSCOptions4
    },
    tempPokeItem4.skillPer
  )
  resRankArr = resRankArr.concat(
    addArrInOptions('食材S,M\n性格:食材↑', tempPokeItem4)
  )

  const tempPokeItem5 = { ...pokedex[pokeId] }
  const tempSCOptions5 = {
    skill: ['ss', 'sm'], // Array: ['none', 'hs', 'hm', 'fs', 'fm', 'hg1', 'hg2', 'hg3', 'hg4', 'hg5']
    character: 'sup' // String: none, hdown, hup, fdown, fup, hdownfup, hupfdown
  }
  tempPokeItem5.helpSpeed = getNewHelpSpeed(
    {
      baseHelpSpeed: tempPokeItem5.helpSpeed,
      ...tempSCOptions5
    },
    helpSpeedCalcForm.value.level
  )
  tempPokeItem5.foodPer = getNewFoodPer(
    {
      ...tempSCOptions5
    },
    tempPokeItem5.foodPer
  )
  tempPokeItem5.skillPer = getNewSkillPer(
    {
      ...tempSCOptions5
    },
    tempPokeItem5.skillPer
  )
  resRankArr = resRankArr.concat(
    addArrInOptions('技率S,M\n性格:技率↑', tempPokeItem5)
  )

  const tempPokeItem6 = { ...pokedex[pokeId] }
  const tempSCOptions6 = {
    skill: ['hm', 'sm'], // Array: ['none', 'hs', 'hm', 'fs', 'fm', 'hg1', 'hg2', 'hg3', 'hg4', 'hg5']
    character: 'sup' // String: none, hdown, hup, fdown, fup, hdownfup, hupfdown
  }
  tempPokeItem6.helpSpeed = getNewHelpSpeed(
    {
      baseHelpSpeed: tempPokeItem6.helpSpeed,
      ...tempSCOptions6
    },
    helpSpeedCalcForm.value.level
  )
  tempPokeItem6.foodPer = getNewFoodPer(
    {
      ...tempSCOptions6
    },
    tempPokeItem6.foodPer
  )
  tempPokeItem6.skillPer = getNewSkillPer(
    {
      ...tempSCOptions6
    },
    tempPokeItem6.skillPer
  )
  resRankArr = resRankArr.concat(
    addArrInOptions('技M,帮忙M\n性格:技率↑', tempPokeItem6)
  )

  const res = sortInObjectOptions(resRankArr, ['oneDayEnergy'], 'down')

  helpSpeedCalcForm.value.rankIndex = res.findIndex(
    item => item.extraDesc.indexOf('自选') > -1
  )
  helpSpeedCalcForm.value.resLength = res.length

  return res
}

const getProcessMuti = formData => {
  return (
    getNewHelpSpeed(
      {
        baseHelpSpeed: formData.baseHelpSpeed,
        skill: ['none'],
        character: 'hdown'
      },
      formData.level
    ) -
    getNewHelpSpeed(
      {
        baseHelpSpeed: formData.baseHelpSpeed,
        skill: ['hs', 'hm'],
        character: 'hup'
      },
      formData.level
    )
  )
}
const getProcessWidth = formData => {
  let res =
    ((getNewHelpSpeed(formData, formData.level) -
      getNewHelpSpeed(
        {
          baseHelpSpeed: formData.baseHelpSpeed,
          skill: ['none'],
          character: 'hdown'
        },
        formData.level
      )) /
      getProcessMuti(formData)) *
    -100

  if (res > 100) {
    res = 100
  }
  return res
}

const setTargetListByHelp = () => {
  targetInList.value = byHelpSpeedRes.value.find(
    item => item.helpSpeed === helpSpeedCalcForm.value.baseHelpSpeed
  )
}

const handleChangePokemon = () => {
  helpSpeedCalcForm.value.baseHelpSpeed =
    pokedex[helpSpeedCalcForm.value.pokemonId].helpSpeed
  helpSpeedCalcForm.value.useFoods = [0, 0, 0]
  setTargetListByHelp()
}

const getBoxCurEngery = () => {
  let resRankArr = []
  userPokemons.value.list.forEach(upItem => {
    const pokeItem = { ...pokedex[upItem.pokemonId] }
    pokeItem.helpSpeed = getNewHelpSpeed(upItem, upItem.level)
    pokeItem.foodPer = getNewFoodPer(upItem, pokeItem.foodPer)
    pokeItem.skillPer = getNewSkillPer(upItem, pokeItem.skillPer)
    pokeItem.level = upItem.level
    pokeItem.useFoods = upItem.useFoods
    pokeItem.skill = upItem.skill

    resRankArr = resRankArr.concat(
      addArrInOptions(getPlayerExtraDesc(upItem), pokeItem, true)
    )
  })
  const res = sortInObjectOptions(resRankArr, ['oneDayEnergy'], 'down')
  return res
}
// const LS_NAME = 'myPokemonBox_testing1'
// const getLSBOX = localStorage.getItem(LS_NAME)
// if (getLSBOX) {
//   userPokemons.value.list = JSON.parse(getLSBOX)
// }
const hanldeClickAddBox = () => {
  const curRes = {
    id: `${new Date().getTime()}${helpSpeedCalcForm.value.pokemonId}`,
    pokemonId: helpSpeedCalcForm.value.pokemonId,
    baseHelpSpeed: helpSpeedCalcForm.value.baseHelpSpeed,
    level: helpSpeedCalcForm.value.level,
    skill: [...helpSpeedCalcForm.value.skill],
    character: helpSpeedCalcForm.value.character,
    useFoods: [...helpSpeedCalcForm.value.useFoods],
    dataIndex: userPokemons.value.list.length
  }
  userPokemons.value.list.push(curRes)
  // localStorage.setItem(LS_NAME, JSON.stringify(userPokemons.value.list))
  // console.log(curRes)
}
const handleClickDelPoke = dataId => {
  // const msg = '您真的确定要删除该宝可梦吗？'
  // if (confirm(msg)) {
  userPokemons.value.list.splice(
    userPokemons.value.list.findIndex(item => item.id === dataId),
    1
  )
  // localStorage.setItem(LS_NAME, JSON.stringify(userPokemons.value.list))
  // }
}

onMounted(() => {
  byHelpSpeedRes.value = initFilterGroup()
  setTargetListByHelp()

  // debug
  // const tempPokeItem2 = { ...pokedex[282] }
  // const res1 = getNewHelpSpeed(
  //   {
  //     baseHelpSpeed: tempPokeItem2.helpSpeed,
  //     ...{
  //       skill: ['hs'],
  //       character: ''
  //     }
  //   },
  //   35
  // )
  // const res2 = getNewHelpSpeed(
  //   {
  //     baseHelpSpeed: tempPokeItem2.helpSpeed,
  //     ...{
  //       skill: ['hs', 'hg2'],
  //       character: ''
  //     }
  //   },
  //   35
  // )
  // console.log(res1, toHM(res1, 'sec'))
  // console.log(res2, toHM(res2, 'sec'))
})
watch(helpSpeedCalcForm.value, val => {
  if (!val.level) {
    helpSpeedCalcForm.value.level = 10
  }
})
</script>
<template>
  <h2>帮忙速度计算</h2>
  <el-form label-width="90px">
    <el-form-item label="宝可梦">
      <el-select
        v-model="helpSpeedCalcForm.pokemonId"
        placeholder="请选择宝可梦"
        filterable
        @change="handleChangePokemon()"
      >
        <template v-for="pokeItem in pokedex" :key="pokeItem.id">
          <el-option
            :label="`${$t(`POKEMON_NAME.${pokeItem.id}`)}-${
              pokeItem.helpSpeed
            }s`"
            :value="pokeItem.id"
          >
            <img
              class="icon"
              v-lazy="`./img/pokedex/${pokeItem.id}.png`"
              :alt="$t(`POKEMON_NAME.${pokeItem.id}`)"
              v-bind:key="pokeItem.id"
            />
            {{ $t(`POKEMON_NAME.${pokeItem.id}`) }}-{{ pokeItem.helpSpeed }}s
          </el-option>
        </template>
      </el-select>
    </el-form-item>
    <el-form-item>
      <i class="i i-rank" :class="`i-rank--${targetInList.sortIndex}`">{{
        targetInList.sortIndex
      }}</i>
      {{ helpSpeedCalcForm.baseHelpSpeed }}s
      <span
        class="cpt-avatar"
        v-for="pokeItem in targetInList.list"
        v-bind:key="pokeItem.id"
      >
        <img
          class="cpt-avatar__pic"
          v-lazy="`./img/pokedex/${pokeItem.id}.png`"
          :alt="$t(`POKEMON_NAME.${pokeItem.id}`)"
        />
      </span>
    </el-form-item>
    <el-form-item label="食材" v-if="pokedex[helpSpeedCalcForm.pokemonId].food">
      <div
        class="cpt-food cpt-food--noborder"
        v-for="(subFoodItem, subKey) in 3"
        v-bind:key="subKey"
      >
        <el-radio-group
          size="small"
          v-model="helpSpeedCalcForm.useFoods[subKey]"
        >
          <template
            v-for="(allFoodItem, allKey) in pokedex[helpSpeedCalcForm.pokemonId]
              .food.type"
            v-bind:key="allKey"
          >
            <el-radio-button
              :label="allKey"
              v-if="
                pokedex[helpSpeedCalcForm.pokemonId].food.count[allFoodItem]
                  .num[subKey] > 0
              "
              style="--el-radio-button-checked-bg-color: #c2e4ff"
            >
              <div class="cpt-food__item">
                <img
                  v-lazy="`./img/food/${allFoodItem}.png`"
                  :alt="FOOD_TYPES[allFoodItem]"
                />
                <div
                  class="cpt-food__count"
                  v-if="
                    pokedex[helpSpeedCalcForm.pokemonId].food.count[allFoodItem]
                      .num[subKey] > 0
                  "
                >
                  {{
                    pokedex[helpSpeedCalcForm.pokemonId].food.count[allFoodItem]
                      .num[subKey]
                  }}
                </div>
              </div>
            </el-radio-button>
          </template>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item label="等级(10-60)">
      <el-slider
        v-model="helpSpeedCalcForm.level"
        show-input
        :min="10"
        :max="60"
      />
      <div style="width: 100%">
        <el-radio-group v-model="helpSpeedCalcForm.level" size="small">
          <el-radio-button
            class="radiogroup--level"
            :label="cItem.label"
            v-for="cItem in levelOptions"
            v-bind:key="cItem.label"
            >{{ cItem.txt }}</el-radio-button
          >
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item label="技能">
      <div style="width: 100%">
        <el-checkbox-group v-model="helpSpeedCalcForm.skill" :min="0" :max="5">
          <el-checkbox
            :label="skillItem.label"
            v-for="skillItem in skillOptionsExtra2"
            v-bind:key="skillItem.label"
          >
            <span class="cpt-skill cpt-skill--3">{{ $t(skillItem.txt) }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div style="width: 100%">
        <el-checkbox-group v-model="helpSpeedCalcForm.skill" :min="0" :max="5">
          <el-checkbox
            :label="skillItem.label"
            v-for="skillItem in skillOptions"
            v-bind:key="skillItem.label"
            ><span class="cpt-skill" :class="`cpt-skill--${skillItem.rare}`">{{
              $t(skillItem.txt) + skillItem.txtExtra
            }}</span></el-checkbox
          >
        </el-checkbox-group>
      </div>
      <div style="width: 100%">
        <el-checkbox-group v-model="helpSpeedCalcForm.skill" :min="0" :max="5">
          <el-checkbox
            :label="skillItem.label"
            v-for="skillItem in skillOptionsExtra"
            v-bind:key="skillItem.label"
            ><span class="cpt-skill cpt-skill--3">{{
              $t(skillItem.txt) + skillItem.txtExtra
            }}</span></el-checkbox
          >
        </el-checkbox-group>
      </div>
      <div class="mod-tips">注：所有帮忙技能加成累积不能超过35%。</div>
    </el-form-item>
    <el-form-item label="性格">
      <el-radio-group v-model="helpSpeedCalcForm.character">
        <el-radio
          :label="cItem.label"
          v-for="cItem in characterOptions"
          v-bind:key="cItem.label"
          :class="{ vigour: cItem.txt.indexOf('帮↓') > -1 }"
          >{{ cItem.txt }}</el-radio
        >
      </el-radio-group>
    </el-form-item>
    <el-form-item>
      <el-button type="success" plain @click="hanldeClickAddBox()"
        >将当前宝可梦加入盒子对比</el-button
      >
    </el-form-item>
    <el-form-item label="计算结果">
      <ul>
        <li>
          {{ helpSpeedCalcForm.level }}级：
          <span class="sptime"
            >{{
              getNewHelpSpeed(helpSpeedCalcForm, helpSpeedCalcForm.level)
            }}s</span
          >
          /
          {{
            toHM(
              getNewHelpSpeed(helpSpeedCalcForm, helpSpeedCalcForm.level),
              "sec"
            )
          }}
        </li>
      </ul>
      <div class="helpprocess">
        <i class="helpprocess__inner"
          ><i :style="`width: ${getProcessWidth(helpSpeedCalcForm)}%`"></i
        ></i>
        <div
          v-for="(processItem, processKey) in allHelpType"
          v-bind:key="processItem.title"
          :style="`left: ${
            ((getNewHelpSpeed(
              {
                baseHelpSpeed: helpSpeedCalcForm.baseHelpSpeed,
                ...processItem,
              },
              helpSpeedCalcForm.level
            ) -
              getNewHelpSpeed(
                {
                  baseHelpSpeed: helpSpeedCalcForm.baseHelpSpeed,
                  skill: ['none'],
                  character: 'hdown',
                },
                helpSpeedCalcForm.level
              )) /
              getProcessMuti(helpSpeedCalcForm)) *
            -100
          }%`"
          class="helpprocess__tag"
          :class="[
            processItem.character.indexOf('hdown') > -1 ? 'down' : '',
            processItem.character.indexOf('hup') > -1 ? 'up' : '',
            `helpprocess__tag--${processKey + 1}`,
            getNewHelpSpeed(helpSpeedCalcForm, helpSpeedCalcForm.level) ===
            getNewHelpSpeed(
              {
                baseHelpSpeed: helpSpeedCalcForm.baseHelpSpeed,
                ...processItem,
              },
              helpSpeedCalcForm.level
            )
              ? 'cur'
              : '',
          ]"
        >
          <pre class="helpprocess__title" v-html="processItem.title"></pre>
          <div class="helpprocess__value">
            {{
              getNewHelpSpeed(
                {
                  baseHelpSpeed: helpSpeedCalcForm.baseHelpSpeed,
                  ...processItem,
                },
                helpSpeedCalcForm.level
              )
            }}s
          </div>
        </div>
      </div>
    </el-form-item>
    <el-form-item label="参考" v-if="helpSpeedCalcForm.level < 100">
      <ul>
        <template v-for="olItem in otherLevelShow" v-bind:key="olItem">
          <li
            v-if="
              helpSpeedCalcForm.level !== olItem &&
              helpSpeedCalcForm.level < olItem
            "
          >
            {{ olItem }}级：
            <span class="sptime"
              >{{ getNewHelpSpeed(helpSpeedCalcForm, olItem) }}s</span
            >
            /
            {{ toHM(getNewHelpSpeed(helpSpeedCalcForm, olItem), "sec") }}
          </li>
        </template>
      </ul>
    </el-form-item>
    <el-form-item label="适正岛屿">
      <el-switch
        v-model="helpSpeedCalcForm.isRightBerry"
        inline-prompt
        active-text="是（2倍树果能量）"
        inactive-text="否"
        style="--el-switch-on-color: #ffaf00"
      />
    </el-form-item>
    <el-form-item label="露营券">
      <el-switch
        v-model="helpSpeedCalcForm.isUseTicket"
        inline-prompt
        active-text="使用（帮忙1.2倍）"
        inactive-text="不使用"
        style="--el-switch-on-color: #ffaf00"
      />
    </el-form-item>
    <el-form-item>
      <el-radio-group v-model="navData.navIndex" fill="#41ae3c">
        <template v-for="cItem in navData.navList"
          v-bind:key="cItem.name">
        <el-radio-button
          :label="cItem.value"
          :disabled="cItem.value === 1 && userPokemons.list.length === 0"
          >{{ cItem.name }}<span v-if="cItem.value === 1">({{userPokemons.list.length}})</span></el-radio-button
        >
        </template>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="快速等级" v-if="navData.navIndex === 0">
      <el-radio-group v-model="helpSpeedCalcForm.level" size="small">
        <el-radio-button
          class="radiogroup--level"
          :label="cItem.label"
          v-for="cItem in levelOptions"
          v-bind:key="cItem.label"
          >{{ cItem.txt }}</el-radio-button
        >
      </el-radio-group>
      <div style="width: 100%">
        当前等级：<span class="sptime">{{ helpSpeedCalcForm.level }}</span
        >级
      </div>
      <div style="width: 100%">
        当前能量排位：第
        <i
          class="i i-rank"
          :class="`i-rank--${helpSpeedCalcForm.rankIndex + 1}`"
          >{{ helpSpeedCalcForm.rankIndex + 1 }}</i
        >
        / {{ helpSpeedCalcForm.resLength }} 位
      </div>
      <el-select
        v-model="helpSpeedCalcForm.contrastPoke"
        placeholder="请选择要对比的宝可梦"
        filterable
        clearable
        class="mb3"
      >
        <template v-for="pokeItem in pokedex" :key="pokeItem.id">
          <el-option
            :label="`对比${$t(`POKEMON_NAME.${pokeItem.id}`)}-${
              pokeItem.helpSpeed
            }s`"
            :value="pokeItem.id"
          >
            <img
              class="icon"
              v-lazy="`./img/pokedex/${pokeItem.id}.png`"
              :alt="$t(`POKEMON_NAME.${pokeItem.id}`)"
              v-bind:key="pokeItem.id"
            />
            {{ $t(`POKEMON_NAME.${pokeItem.id}`) }}-{{ pokeItem.helpSpeed }}s
          </el-option>
        </template>
      </el-select>
    </el-form-item>
  </el-form>
  <div class="page-inner">
    <div class="poke-tb poke-tb--xscorll mb3" v-if="navData.navIndex === 0">
      <CptEnergyItem
        :pokeItem="pokeItem"
        :pokeKey="pokeKey"
        :showKey="[
          'helpSpeed',
          'helpSpeedHM',
          'berry',
          'pokeType',
          'foodPer',
          'skillPer',
        ]"
        :class="{
          cur: pokeItem.extraDesc.indexOf('自选') > -1,
          default: pokeItem.extraDesc.indexOf('白') > -1,
          contrast: pokeItem.extraDesc.indexOf('对比') > -1,
        }"
        v-for="(pokeItem, pokeKey) in getTargetPokemonEnergy(
          helpSpeedCalcForm.pokemonId
        )"
        v-bind:key="`${pokeItem.id}_${pokeKey}_${pokeItem.useFoods.join('')}_${
          pokeItem.nameExtra || ''
        }_${pokeItem.extraDesc || ''}`"
        :isHightLightBerry="helpSpeedCalcForm.isRightBerry"
      />
    </div>
    <h3 v-if="userPokemons.list.length > 0 && navData.navIndex === 1">
      宝可梦盒子<span class="extra">({{ userPokemons.list.length }})</span>
    </h3>
    <div class="poke-tb poke-tb--xscorll" v-if="userPokemons.list.length > 0 && navData.navIndex === 1">
      <CptEnergyItem
        class="poke-tb__item--hasclose"
        :pokeItem="pokeItem"
        :pokeKey="pokeKey"
        :showKey="[
          'helpSpeed',
          'helpSpeedHM',
          'berry',
          'pokeType',
          'foodPer',
          'skillPer',
          'skillType'
        ]"
        v-for="(pokeItem, pokeKey) in getBoxCurEngery()"
        v-bind:key="`${pokeItem.id}_${pokeKey}_${pokeItem.useFoods.join('')}_${
          pokeItem.nameExtra || ''
        }_${pokeItem.extraDesc || ''}`"
        :isHightLightBerry="helpSpeedCalcForm.isRightBerry"
      >
        <p class="spscore">{{ pokeItem.level }}级</p>
        <i class="i i-close" @click="handleClickDelPoke(pokeItem.id)"></i>
      </CptEnergyItem>
    </div>
  </div>
  <el-form label-width="90px">
    <el-form-item>
      <div class="mod-tips">
        <p>* 数值均为程序预估结果，与实际有误差。</p>
        <p>* 结果为对应等级一天产出。</p>
        <p>* 非满包满活力，非技能型宝可梦无技能保底。</p>
      </div>
    </el-form-item>
  </el-form>
</template>