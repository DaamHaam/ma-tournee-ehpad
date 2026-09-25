import { expect, test } from '@playwright/test'

test('première tournée, ajout patient et export', async ({ page }) => {
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (const removed of ['Ma tournée', 'Enregistré sur cet appareil', 'Ouvrir une date', 'Données d’essai', 'Fictif']) await expect(page.getByText(removed)).toHaveCount(0)
  await page.getByRole('link', { name: /Patients/ }).click()
  await page.getByRole('button', { name: 'Ajouter' }).click()
  await page.getByLabel('Nom', { exact: true }).fill('Durand')
  await page.getByLabel('Prénom', { exact: true }).fill('Camille')
  await page.getByLabel('Chambre', { exact: true }).fill('42')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText('Durand Camille')).toBeVisible()
  await page.getByRole('link', { name: /Journée/ }).click()
  await expect(page.getByText('Durand Camille')).toBeVisible()
  await page.getByRole('button', { name: 'A pour Durand Camille' }).click()
  await page.getByRole('link', { name: /Réglages/ }).click()
  await expect(page.locator('pre')).toContainText('Durand')
  await expect(page.getByText(/^Version \d+\.\d+\.\d+$/)).toBeVisible()
  await expect(page.getByText('Sur cet appareil')).toHaveCount(0)
  await page.getByRole('link', { name: /Patients/ }).click()
  await page.getByRole('link', { name: /Durand Camille/ }).click()
  await expect(page.getByRole('heading', { name: 'Durand Camille' })).toBeVisible()
  await expect(page.getByLabel('Séances et notes')).toContainText('Séance A')
  for (const removed of ['Identité utile', 'Historique', 'trace', 'Gestion de la fiche', 'L’archivage retire']) await expect(page.getByText(removed)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Archiver' })).toBeVisible()
})

test('la version de production se recharge hors ligne', async ({ page, context }) => {
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  const firstPatient = page.getByRole('button', { name: 'A pour MARTIN Alice' })
  await firstPatient.click()
  await expect(firstPatient).toHaveAttribute('aria-pressed', 'true')
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'A pour MARTIN Alice' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: /Réglages/ }).click()
  await expect(page.locator('pre')).toContainText('Martin')
})

test('import de patients par copier-coller puis suivi éval/trans', async ({ page }) => {
  // Données fictives au format tableur : en-tête, ligne vide et colonne « groupe » ignorés.
  const pasted = [
    'prenom\tcouverture\tseances\tifd\tpointe\tfacture\teval\ttrans\tfin_ordo\tmedecin\tcotation\tgroupe',
    'EXEMPLE COMPOSE\tBeta\tALD\tLV\tnon\toui\toui\tnon\tnon\t19/05/2027\tDr Test\tRPE 8.5\t1',
    '\t\t\t\t\t\t\t\t\t\t\t',
    'FICTIF\t\tMutuelle\tLJV\tLJ\toui\toui\tnon\tnon\t07/11/2026\t?\tAMC 8,5\t4',
  ].join('\n')
  await page.goto('/#/settings')
  await page.getByLabel('Données patients').fill(pasted)
  page.once('dialog', dialog => void dialog.accept())
  await page.getByRole('button', { name: 'Importer' }).click()
  await expect(page.getByText('2 patients importés.')).toBeVisible()

  await page.getByRole('link', { name: /Journée/ }).click()
  await expect(page.getByText('Martin Alice')).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'Éval ou trans : date inconnue' })).toHaveCount(2)
  await page.getByRole('button', { name: 'A pour EXEMPLE COMPOSE Beta' }).click()
  await page.getByRole('button', { name: 'B pour FICTIF', exact: true }).click()

  await page.getByRole('link', { name: /EXEMPLE COMPOSE/ }).click()
  await expect(page.getByLabel('Couverture')).toHaveValue('ALD')
  await expect(page.getByLabel('Fin d’ordonnance')).toHaveValue('2027-05-19')
  await expect(page.getByLabel('Médecin traitant')).toHaveValue('Dr Test')
  await expect(page.getByRole('button', { name: 'Séances V' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Séances J' })).toHaveAttribute('aria-pressed', 'false')
  await page.getByLabel('Trans').click()
  await expect(page.getByLabel('Trans')).toBeChecked()
  await page.getByRole('link', { name: /Journée/ }).click()
  await expect(page.getByRole('img', { name: /^Dernière éval ou trans/ })).toHaveClass(/recent/)

  await page.getByRole('link', { name: /Réglages/ }).click()
  await expect(page.locator('pre')).toContainText('Exemple fictif')
})
