<script setup>
import { ref, onMounted } from 'vue'
import CptPoke from '../components/CptPoke/ItemIndex.vue'
import CptFoodmenu from '../components/CptFoodmenu/MenuItem.vue'
import { pokedex } from '../config/pokedex.js'
import { gameMap } from '../config/game.js'
import { FOOD_TYPES, SKILL_TYPES } from '../config/valKey.js'
import {
  get,
  sortInObjectOptions,
  getPercent,
  findMenuWithFood,
  getStageLevelPicId
} from '../utils/index.js'
import { getUnLockSleeps } from '../utils/sleep.js'

import i18n from '../i18n'
const { t } = i18n.global

const pokedexLength = ref(0)
const curFilter = ref('all')
const filterResGroup = ref({
  helpSpeed: {},
  berryType: {},
  skillType: {},
  foodType: {},
  sleepType: {}
})

// 存储每个地图每个等级会出现的宝可梦
const gameMapPokemons = [
  // {
  //   levelPokemons: [], //stage level pokemons
  //   allPokemons: [] //all pokemons
  // }
]
gameMap.forEach((gitem, gkey) => {
  const curMapSleeps = getUnLockSleeps(gitem.levelList, 34).allUnlockSleepsList
  gameMapPokemons.push({
    levelPokemons: [],
    allPokemons: [],
    pokemonsIdToMapLevelIndex: {}
  })
  curMapSleeps.forEach(sleepsItem => {
    if (!gameMapPokemons[gkey].levelPokemons[sleepsItem.unLockLevel]) {
      gameMapPokemons[gkey].levelPokemons[sleepsItem.unLockLevel] = []
    }
    if (
      !gameMapPokemons[gkey].levelPokemons[sleepsItem.unLockLevel].includes(
        sleepsItem.pokeId
      ) &&
      !gameMapPokemons[gkey].allPokemons.includes(sleepsItem.pokeId)
    ) {
      gameMapPokemons[gkey].levelPokemons[sleepsItem.unLockLevel].push(
        sleepsItem.pokeId
      )
      gameMapPokemons[gkey].pokemonsIdToMapLevelIndex[sleepsItem.pokeId] =
        sleepsItem.unLockLevel
    }
    if (!gameMapPokemons[gkey].allPokemons.includes(sleepsItem.pokeId)) {
      gameMapPokemons[gkey].allPokemons.push(sleepsItem.pokeId)
    }
  })
})
// console.log(gameMapPokemons)

const filterItemInFor = (pokeItem, resList, orgList, keyVel, title) => {
  if (pokeItem[keyVel] && !orgList.includes(pokeItem[keyVel])) {
    const resItem = {
      id: pokeItem[keyVel],
      title: title,
      list: []
    }
    resItem[keyVel] = pokeItem[keyVel]
    resList.push(resItem)
    orgList.push(pokeItem[keyVel])
  }
  resList.find(item => item[keyVel] === pokeItem[keyVel]).list.push(pokeItem)
}

const initFilterGroup = () => {
  let byHelpSpeedResIn = []
  const byHelpSpeedOrgList = []

  let byBerryTypeResIn = []
  const byBerryTypeOrgList = []

  let bySkillTypeResIn = []
  const bySkillTypeOrgList = []

  let bySleepTypeResIn = []
  const bySleepTypeOrgList = []

  let byFoodTypeResIn = []

  // 食材类型
  for (const key in FOOD_TYPES) {
    if (Object.hasOwnProperty.call(FOOD_TYPES, key)) {
      byFoodTypeResIn.push({
        id: +key,
        foodType: FOOD_TYPES[key],
        title: `${FOOD_TYPES[key]}`,
        list: []
      })
    }
  }

  let plistLength = 0
  for (const pokeKey in pokedex) {
    if (Object.hasOwnProperty.call(pokedex, pokeKey)) {
      plistLength++

      const pokeItem = pokedex[pokeKey]

      // 帮忙速度分类
      filterItemInFor(
        pokeItem,
        byHelpSpeedResIn,
        byHelpSpeedOrgList,
        'helpSpeed',
        `${pokeItem.helpSpeed}s`
      )

      // 睡眠类型分类
      filterItemInFor(
        pokeItem,
        bySleepTypeResIn,
        bySleepTypeOrgList,
        'sleepType',
        t(`SLEEP_TYPES.${pokeItem.sleepType}`)
      )

      // 树果类型
      filterItemInFor(
        pokeItem,
        byBerryTypeResIn,
        byBerryTypeOrgList,
        'berryType',
        t(`BERRY_TYPES.${pokeItem.berryType}`)
      )

      // 技能类型
      filterItemInFor(
        pokeItem,
        bySkillTypeResIn,
        bySkillTypeOrgList,
        'skillType',
        t(`SKILL_TYPES.${pokeItem.skillType}`)
      )

      // 食材类型
      if (get('food.type', pokeItem, 1)) {
        byFoodTypeResIn.forEach(item => {
          if (pokeItem.food.type.includes(item.id)) {
            item.list.push(pokeItem)
          }
        })
      }
    }
  }
  pokedexLength.value = plistLength

  byHelpSpeedResIn.forEach(item => {
    item.count = item.list.length
    item.list = sortInObjectOptions(
      [...item.list],
      ['pokeType', 'berryType', 'id'],
      'up'
    )
  })
  byHelpSpeedResIn = sortInObjectOptions(byHelpSpeedResIn, ['helpSpeed'], 'up')
  filterResGroup.value.helpSpeed = byHelpSpeedResIn

  bySleepTypeResIn.forEach(item => {
    item.count = item.list.length
  })
  bySleepTypeResIn = sortInObjectOptions(bySleepTypeResIn, ['count'], 'down')
  filterResGroup.value.sleepType = bySleepTypeResIn

  byBerryTypeResIn.forEach(item => {
    item.count = item.list.length
    item.list = sortInObjectOptions(
      [...item.list],
      ['berryType', 'pokeType'],
      'up'
    )
  })
  byBerryTypeResIn = sortInObjectOptions(
    byBerryTypeResIn,
    ['count', 'skillType'],
    'down'
  )
  filterResGroup.value.berryType = byBerryTypeResIn

  bySkillTypeResIn.forEach(item => {
    item.count = item.list.length
    item.list = sortInObjectOptions([...item.list], ['pokeType'], 'down')
  })
  bySkillTypeResIn = sortInObjectOptions(
    bySkillTypeResIn,
    ['count', 'SkillType'],
    'down'
  )
  filterResGroup.value.skillType = bySkillTypeResIn

  const levelArr = [0, 30, 60]
  byFoodTypeResIn.forEach(resItem => {
    resItem.count = resItem.list.length
    resItem.menuList = findMenuWithFood([resItem.id])

    levelArr.forEach((levelItem, levelKey) => {
      const res = resItem.list.filter(
        pitem => pitem.food.type[levelKey] === resItem.id
      )
      resItem[`level${levelKey}List`] = {
        subTitle: levelItem,
        subCount: res.length,
        subList: res
      }
    })
  })
  byFoodTypeResIn = sortInObjectOptions(byFoodTypeResIn, ['count'], 'down')
  filterResGroup.value.foodType = byFoodTypeResIn
}
const getShowKeyVal = pokemonsItem => {
  const showKey = [
    'helpSpeed',
    'berry',
    'pokeType',
    'skillType',
    'foodPer',
    'skillPer',
    'fullFood',
    'sleepType'
  ]
  // if (pokedex[pokemonsItem] && get('pokeType', pokedex[pokemonsItem])) {
  //   const res = pokedex[pokemonsItem]
  //   // console.log(res)
  //   if (res.pokeType === 1) {
  //     // 树果型
  //     // showKey.push('helpSpeed', 'berry')
  //   } else if (res.pokeType === 2) {
  //     // 食材型
  //     // showKey.push('foodPer')
  //   }
  // }
  // console.log(showKey)
  return showKey
}

const fnGetBy = filterType => {
  curFilter.value = filterType
}

onMounted(() => {
  initFilterGroup() // 初始化索引
})
</script>
<template>
  <h2>
    全图鉴速查<span class="extra">({{ pokedexLength }}只)</span>
  </h2>
  <div class="page-inner">
    <el-radio-group v-model="curFilter">
      <el-radio-button label="all" @click="fnGetBy('all')">ALL</el-radio-button>
      <el-radio-button label="helpSpeed" @click="fnGetBy('helpSpeed')"
        >帮忙速度↓</el-radio-button
      >
      <el-radio-button label="berryType" @click="fnGetBy('berryType')"
        >树果类型↓</el-radio-button
      >
      <el-radio-button label="foodType" @click="fnGetBy('foodType')"
        >食材类型↓</el-radio-button
      >
      <el-radio-button label="skillType" @click="fnGetBy('skillType')"
        >技能类型↓</el-radio-button
      >
      <el-radio-button label="sleepType" @click="fnGetBy('sleepType')"
        >睡眠类型↓</el-radio-button
      >
    </el-radio-group>
  </div>
  <div class="pokedex-list">
    <template v-if="curFilter !== 'all'">
      <div
        class="pokedex-list__item"
        v-for="resItem in filterResGroup[curFilter]"
        v-bind:key="resItem.id"
      >
        <h3>
          {{ resItem.title }}
          <span class="extra"
            >({{ resItem.list.length }}只 /
            {{ getPercent(resItem.list.length, pokedexLength, 2) }}%)</span
          >
        </h3>
        <div class="poke-tb">
          <template v-if="curFilter === 'foodType'">
            <div class="cpt-foodmenu-list">
              <h3>
                关联食谱<span class="extra"
                  >({{ resItem.menuList.length }}个)</span
                >
              </h3>
              <div class="cpt-foodmenu-scroll cpt-foodmenu-scroll--singlerow">
                <CptFoodmenu
                  v-for="menuItem in resItem.menuList"
                  v-bind:key="menuItem.id"
                  :menuItem="menuItem"
                />
              </div>
            </div>
            <div
              class="poke-tb__col"
              v-for="(levelItem, levelKey) in 3"
              v-bind:key="`${resItem.id}_${levelKey}`"
            >
              <h4>
                {{ resItem[`level${levelKey}List`].subTitle }}级
                <span class="extra"
                  >({{ resItem[`level${levelKey}List`].subList.length }}只
                  <template
                    v-if="resItem[`level${levelKey}List`].subList.length > 0"
                  >
                    /
                    {{
                      getPercent(
                        resItem[`level${levelKey}List`].subList.length,
                        pokedexLength,
                        2
                      )
                    }}%</template
                  >)
                </span>
              </h4>
              <div
                class="mod-tips"
                v-if="resItem[`level${levelKey}List`].subList.length === 0"
              >
                无
              </div>
              <div class="poke-tb__sublist" v-else>
                <div
                  class="poke-tb__item"
                  v-for="(pokemonsItem, pokemonKey) in resItem[
                    `level${levelKey}List`
                  ].subList"
                  v-bind:key="pokemonsItem.name"
                >
                  <CptPoke
                    :pokeId="pokemonsItem.id"
                    :showKey="getShowKeyVal(pokemonKey)"
                  />
                </div>
              </div>
            </div>
          </template>
          <div class="poke-tb__sublist" v-else>
            <div
              class="poke-tb__item"
              v-for="(pokemonsItem, pokemonKey) in resItem.list"
              v-bind:key="pokemonsItem.name"
            >
              <CptPoke
                :pokeId="pokemonsItem.id"
                :showKey="getShowKeyVal(pokemonKey)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- S 全图鉴 -->
    <div class="poke-tb" v-else>
      <div
        class="poke-tb__item"
        v-for="(pokemonsItem, pokemonKey) in pokedex"
        v-bind:key="pokemonsItem.name"
      >
        <CptPoke :pokeId="+pokemonKey" :showKey="getShowKeyVal(pokemonKey)" />
        <ul
          class="cpt-select-list"
          v-for="(mapItem, mapKey) in gameMap"
          v-bind:key="mapItem.id"
        >
          <li
            class="cpt-select-list__item cur"
            v-if="gameMapPokemons[mapKey].allPokemons.includes(+pokemonKey)"
          >
            <div class="cpt-select-list__name">
              {{ $t(`ILAND.${mapItem.id}`) }}
              <p>
                <img
                  class="icon"
                  v-lazy="
                    `./img/ui/${getStageLevelPicId(
                      gameMap[mapKey].levelList[
                        gameMapPokemons[mapKey].pokemonsIdToMapLevelIndex[
                          +pokemonKey
                        ]
                      ].name
                    )}.png`
                  "
                />
                {{
                  gameMap[mapKey].levelList[
                    gameMapPokemons[mapKey].pokemonsIdToMapLevelIndex[
                      +pokemonKey
                    ]
                  ].name
                }}
              </p>
            </div>
            <img
              v-if="mapItem.pic"
              class="cpt-select-list__bg"
              v-lazy="`./img/ui/${mapItem.pic}.png`"
              :alt="mapItem.name"
            />
          </li>
        </ul>
      </div>
      <!-- E 全图鉴 -->
    </div>
  </div>
</template>