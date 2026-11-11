const listResult = document.getElementById('list-result');
const picker = document.getElementById('local-file');
const links = document.querySelectorAll('nav a');
let selectedLink;
let latestRequest = 0;

function renderList(link, values) {
  if (!Array.isArray(values) || !values.every(value => typeof value === 'string')) {
    throw new Error('Файл має містити JSON-масив рядків.');
  }
  const title = document.createElement('strong');
  title.textContent = link.dataset.title;
  const list = document.createElement('ul');
  for (const value of values) {
    const item = document.createElement('li');
    item.textContent = value;
    list.append(item);
  }
  listResult.replaceChildren(title, list);
  links.forEach(item => item.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'true');
}

for (const link of links) {
  link.addEventListener('click', async event => {
    event.preventDefault();
    const request = ++latestRequest;
    const filename = link.getAttribute('href');

    if (location.protocol === 'file:') {
      selectedLink = link;
      picker.value = '';
      listResult.textContent = 'Оберіть ' + filename + ' з розпакованої папки.';
      picker.click();
      return;
    }

    listResult.textContent = 'Завантаження…';
    try {
      const response = await fetch(filename);
      if (!response.ok) throw new Error('Не вдалося завантажити ' + filename + '.');
      const values = await response.json();
      if (request === latestRequest) renderList(link, values);
    } catch (error) {
      if (request === latestRequest) listResult.textContent = error.message;
    }
  });
}

picker.addEventListener('change', async () => {
  const link = selectedLink;
  const request = latestRequest;
  const file = picker.files[0];
  if (!link || !file) return;
  const filename = link.getAttribute('href');
  if (file.name !== filename) {
    listResult.textContent = 'Потрібен файл ' + filename + '. Натисніть на посилання ще раз.';
    return;
  }

  try {
    const values = JSON.parse(await file.text());
    if (request === latestRequest) renderList(link, values);
  } catch {
    if (request === latestRequest) listResult.textContent = 'Файл не вдалося прочитати як JSON-масив рядків.';
  }
});

const OPENWEATHER_API_KEY = '358331e0f3db444f88cd1ccbfd8217b9';

const weatherForm = document.getElementById('weather-form');
const weatherResult = document.getElementById('weather-result');
weatherForm.addEventListener('submit', async event => {
  event.preventDefault();
  const city = document.getElementById('city').value.trim();
  if (!city) {
    weatherResult.textContent = 'Введіть місто.';
    return;
  }
  const button = weatherForm.querySelector('button');
  button.disabled = true;
  weatherResult.textContent = 'Завантаження погоди…';
  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.search = new URLSearchParams({ q: city, appid: OPENWEATHER_API_KEY, units: 'metric' });
    const response = await fetch(url);
    if (!response.ok) {
      const messages = {401:'Ключ недійсний або ще не активований.',404:'Місто не знайдено.',429:'Забагато запитів. Спробуйте пізніше.'};
      throw new Error(messages[response.status] || 'Помилка сервісу погоди: HTTP ' + response.status);
    }
    const data = await response.json();
    const rows = [data.name || city, 'Температура: ' + data.main.temp + ' °C',
      'Вологість: ' + data.main.humidity + ' %', 'Швидкість вітру: ' + data.wind.speed + ' м/с'];
    weatherResult.replaceChildren(...rows.map(text => {
      const row = document.createElement('div');
      row.textContent = text;
      return row;
    }));
  } catch (error) {
    weatherResult.textContent = error instanceof TypeError ? 'Не вдалося отримати дані погоди.' : error.message;
  } finally {
    button.disabled = false;
  }
});
