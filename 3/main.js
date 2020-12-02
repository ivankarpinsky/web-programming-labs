window.onload = async function () {
    let cookAgree = getCookie('agree');

    let agree = cookAgree ? true : confirm('Согласны ли вы предоставить данные о вашей геолокации');
    if (agree) {
        setCookie('agree', true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            fetch(`http://localhost:3000/weather/coordinates?lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
                .then(async response => {
                    setCurrentWeather(await response.json());
                })
                .catch(async err => {
                    console.log(err);
                });
        });
    } else {
        let response = await fetch(`http://localhost:3000/weather/city?q=Saint Petersburg`);
        if (response.ok) {
            let json = await response.json();
            setCurrentWeather(json);
            console.log(json);
        }
    }

    setFavoritesWeather();

    let addForm = document.getElementById('add-new-town-form');
    addForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        let newTownInput = this.querySelector('#add-new-town-input');
        let cityName = newTownInput.value.toLowerCase();

        await fetch('http://localhost:3000/favourites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({name: cityName})
        }).then(async function(response) {
            if (!response.ok) {
                alert('Данный город уже есть в избранных');
            } else {
                await addCardToList(document.getElementById('favorite-towns'), cityName);
            }
        }).catch(async function(err) {
            alert('Не удалось получить данные по указанному городу');
        });

    });
    let reloadButton = document.getElementById('reload-geo');
    reloadButton.addEventListener('click', async function () {
        let preloader = document.querySelector('#preloader-top');
        preloader.classList.remove('preloader-hidden');
        preloader.classList.add('preloader-visible');
        if (getCookie('agree') || confirm('Согласны ли вы предоставить данные о вашей геолокации')) {
            setCookie('agree', true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                let response = await fetch(`http://localhost:3000/weather/coordinates?lat=${position.coords.latitude}&lon=${position.coords.longitude}`);

                if (response.ok) {
                    let json = await response.json();
                    setCurrentWeather(json);

                    console.log(json);
                } else {
                    alert("Ошибка HTTP: " + response.status);
                }
            });
        } else {
            let response = await fetch(`http://localhost:3000/weather/city?q=Saint Petersburg`);
            setCookie('agree', true, -1);
            if (response.ok) {
                let json = await response.json();
                setCurrentWeather(json);
                console.log(json);
            }
        }
    });
};

function setCurrentWeather(data) {
    let leftBlock = document.querySelector('#top-weather__left-block');
    let h3 = leftBlock.querySelector('h3');
    let img = leftBlock.querySelector('img');
    let degrees = leftBlock.querySelector('.big-degrees');
    h3.innerText = data.city.name;
    img.src = 'http://openweathermap.org/img/wn/' + data.list[0].weather[0].icon + '@4x.png';
    degrees.innerText = data.list[0].main.temp + '° C';

    let topRightBlock = document.querySelector("#top-weather__right-block");
    topRightBlock.innerHTML = '';
    setCardInfo(topRightBlock, data);
    let preloader = document.querySelector('#preloader-top');
    preloader.classList.remove('preloader-visible');
    preloader.classList.add('preloader-hidden');
}

function setCardInfo(block, data) {
    let weather = data.list[0];
    let template = document.querySelector('#info-item-template');
    let name, value, clones = [];

    name = template.content.querySelector('.info-item__name');
    value = template.content.querySelector('.info-item__value');

    name.textContent = 'Ветер';
    value.textContent = `${weather.wind.speed} m/s, ${weather.wind.deg}°`;
    clones.push(document.importNode(template.content, true));

    name.textContent = 'Облачность';
    value.textContent = `${weather.clouds.all}%`;
    clones.push(document.importNode(template.content, true));

    name.textContent = 'Давление';
    value.textContent = `${weather.main.pressure} hpa`;
    clones.push(document.importNode(template.content, true));

    name.textContent = 'Влажность';
    value.textContent = `${weather.main.humidity}%`;
    clones.push(document.importNode(template.content, true));

    name.textContent = 'Координаты';
    value.textContent = `[${data.city.coord.lat}, ${data.city.coord.lon}]`;
    clones.push(document.importNode(template.content, true));

    clones.forEach((item) => block.appendChild(item));
}

async function setFavoritesWeather() {
    let response3 = await fetch('http://localhost:3000/favourites');
    let towns = await response3.json();
    console.log(towns);
    if (towns == null) return;
    let favorites = document.querySelector('#favorite-towns');

    for (const townObj of towns) {
        let town = townObj.name;
        await addCardToList(favorites, town);
    }
}

async function addCardToList(favorites, town) {
    let townTemplate = document.querySelector('#city-weather-template');
    let emptyTown = townTemplate.cloneNode(true);
    let data, cityName, degrees, img, ul;
    favorites.appendChild(document.importNode(emptyTown.content, true));

    await fetch(`http://localhost:3000/weather/city?q=${town}`)
        .then(async response => {
            data = await response.json();
            console.log(data);
            if (data.error == 'City not found') {
                cityName = townTemplate.content.querySelector('.top-block__city-name');
                cityName.innerText = town;
                degrees = townTemplate.content.querySelector('.degrees');
                img = townTemplate.content.querySelector('img');
                ul = townTemplate.content.querySelector('ul');
                degrees.innerHTML = '';
                ul.innerHTML = '';
                img.src = '';

                let errorMessage = townTemplate.content.querySelector('.error-info');
                errorMessage.innerHTML = 'Данного города не существует';
                let preloader = townTemplate.content.querySelector('.preloader');
                preloader.classList.remove('preloader-visible');
                preloader.classList.add('preloader-hidden');
                favorites.removeChild(favorites.lastElementChild);
                favorites.appendChild(document.importNode(townTemplate.content, true));
                errorMessage.innerHTML = '';
                preloader.classList.add('preloader-visible');
                preloader.classList.remove('preloader-hidden');
                return;
            }
            cityName = townTemplate.content.querySelector('.top-block__city-name');
            degrees = townTemplate.content.querySelector('.degrees');
            img = townTemplate.content.querySelector('img');
            ul = townTemplate.content.querySelector('ul');
            ul.innerHTML = '';

            setCardInfo(ul, data);

            cityName.innerText = town;
            img.src = 'http://openweathermap.org/img/wn/' + data.list[0].weather[0].icon + '@2x.png';
            degrees.innerText = data.list[0].main.temp + '° C';
            let preloader = townTemplate.content.querySelector('.preloader');

            preloader.classList.remove('preloader-visible');
            preloader.classList.add('preloader-hidden');
            favorites.removeChild(favorites.lastElementChild);
            favorites.appendChild(document.importNode(townTemplate.content, true));
            preloader.classList.add('preloader-visible');
            preloader.classList.remove('preloader-hidden');
        })
        .catch(async err => {
            console.log(err);
            cityName = townTemplate.content.querySelector('.top-block__city-name');
            cityName.innerText = town;
            degrees = townTemplate.content.querySelector('.degrees');
            img = townTemplate.content.querySelector('img');
            ul = townTemplate.content.querySelector('ul');
            degrees.innerHTML = '';
            ul.innerHTML = '';
            img.src = '';

            let errorMessage = townTemplate.content.querySelector('.error-info');
            errorMessage.innerHTML = 'Не удалось загрузить данные';
            let preloader = townTemplate.content.querySelector('.preloader');
            preloader.classList.remove('preloader-visible');
            preloader.classList.add('preloader-hidden');
            favorites.removeChild(favorites.lastElementChild);
            favorites.appendChild(document.importNode(townTemplate.content, true));
            errorMessage.innerHTML = '';
            preloader.classList.add('preloader-visible');
            preloader.classList.remove('preloader-hidden');
        });

    let deleteButtons = document.getElementsByClassName('delete-button');
    for (let j = 0; j < deleteButtons.length; j++) {
        deleteButtons[j].addEventListener('click', async function (e) {
            e.preventDefault();
            let cityName = deleteButtons[j].previousElementSibling.previousElementSibling.previousElementSibling.innerText;
            let weatherBlock = this.parentElement.parentElement;
            cityName = cityName.toLowerCase();

            let response = await fetch('http://localhost:3000/favourites', {
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({name: cityName})
            });

            weatherBlock.parentElement.removeChild(weatherBlock);
        });
    }
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}