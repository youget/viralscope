export const checkLevelRequirements = (currentLevel, targetLevel, pet, totalClicks) => {
  const requirements = []
  
  for (let level = currentLevel + 1; level <= targetLevel; level++) {
    const req = {
      level,
      clicks: level * 1000,
      happiness: Math.min(10 + (level - 2), 90),
      health: Math.min(10 + ((level - 2) * 2), 90),
      hunger: 30,
    }
    requirements.push(req)
  }

  const unmet = requirements.filter(req => 
    totalClicks < req.clicks ||
    pet.happiness < req.happiness ||
    pet.health < req.health ||
    pet.hunger > req.hunger
  )

  return {
    canLevelUp: unmet.length === 0,
    unmet,
    nextRequirement: requirements[0]
  }
}

export const calculateBuyPrice = (fromLevel, toLevel, basePrice = 10000) => {
  const levelDiff = toLevel - fromLevel
  if (levelDiff <= 0) return 0

  let totalNormal = 0
  for (let i = fromLevel + 1; i <= toLevel; i++) {
    totalNormal += i * basePrice
  }

  const multiplier = 
    levelDiff === 1 ? 1 :
    levelDiff === 2 ? 1.8 :
    levelDiff === 3 ? 2.5 :
    levelDiff === 4 ? 3.2 :
    levelDiff === 5 ? 4 :
    levelDiff * 0.8

  return Math.floor(totalNormal * multiplier)
}

export const getResetRange = (level) => {
  return Math.floor((level - 1) / 10) + 1
}
