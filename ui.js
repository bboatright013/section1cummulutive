$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $mainNavLinks = $(".main-nav-links"); //BB
  const $navWelcome = $("#nav-welcome"); //BB
  const $navUserProfile = $("#nav-user-profile"); //BB
  const $navSubmit = $("#nav-submit"); //BB
  const $submitFormButton = $("#submit-form-button"); //BB
  const $navFaves = $("#nav-favorites"); //BB
  const $favoriteArticles = $("#favorited-articles"); //BB
  const $articlesContainer = $(".articles-container"); //BB
  const $profileName = $("#profile-name"); //BB
  const $profileUsername = $("#profile-username"); //BB
  const $profileAccountDate = $("#profile-account-date"); //BB
  const $myStories = $("#nav-my-stories"); //BB
  const $myArticles = $("#my-articles"); //BB
  const $editButton = $("#editBtn"); //BB
  const $editAccountForm = $("#edit-account-form"); //BB
  const $editAccountName = $("#edit-account-name"); //BB
  const $editAccountPassword = $("#edit-account-password"); //BB
  const $submitEditAccountButton = $("#edit-account-form button"); //BB
  const $mobileNav = $("#mobileNav"); //BB
  const $menuDrop = $(".fa-bars"); //BB
  const $body = $("body"); //BB

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  // my global vars
  let editedStory = null;

  let storyCount = 1;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();
    let userInstance = null;
    // call the login static method to build a user instance
    try{
      userInstance = await User.login(username, password);

    } catch(error){
      alert(error);
      return;
    }
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();
    let newUser = null;
    // call the create method, which calls the API and then builds a new user instance
    try {
      newUser = await User.create(username, password, name);
    } catch (error){
      alert(error);
      return;
    }
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
    $editAccountForm.hide();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });
   /*
 *  Event Listener for the favorites button
 *  if succesful will switch views between all stories 
 *  and favorite stories
 * -BB
 */

 $navFaves.on("click", function(){
  $allStoriesList.hide();
  $submitForm.hide();
  $myArticles.hide();
  $editAccountForm.hide();
  $favoriteArticles.show();
  generateFavorites();
})

$myStories.on("click", function(){
  $allStoriesList.hide();
  $submitForm.hide();
  $favoriteArticles.hide();
  $editAccountForm.hide();
  $myArticles.show();
  generateMyStories();
})

$menuDrop.on("click", function(){
  if($mobileNav.css("display") === "flex"){
    $mobileNav.css("display", "");

  } else {
    $mobileNav.css("display", "flex");
    if(currentUser){
      $mainNavLinks.css("display","flex");
    }}}
)

  
    /*
  * Event Listener for submit story button
  * If succesful we will open the form 
  * for the story data
  *  - BB
  */
 $navSubmit.on("click", function(){
  $favoriteArticles.hide();
  $myArticles.hide();
  $editAccountForm.hide();
  $allStoriesList.show();
  $submitForm.show();
  })
  /*
  *  Event Listener to create story obj
  * If succesful we will have a complete story to upload
  * -BB
  */
  $submitFormButton.on('click', async function(){
  const newAuthor = $("#author").val();
  const newTitle = $("#title").val();
  const newURL = $("#url").val();
  const newStory = new Story({author: newAuthor, title: newTitle, url: newURL});
  await storyList.addStory(currentUser, newStory);

  const name = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  currentUser = await User.getLoggedInUser(token, name);

  await generateStories();
  generateMyStories();
  $submitForm.trigger("reset");
  $submitForm.hide();
  })

  /* 
  * Event Listener for editing user profile
  * -BB
  */

  $navUserProfile.on("click", function(){
    if($editAccountForm.css("display") === "none"){
    $submitForm.hide();
    $editAccountForm.show();
    } else {
      $editAccountForm.hide();
    }
  })

  $submitEditAccountButton.on("click", async function(){
   const name = $editAccountName.val();
   const pword = $editAccountPassword.val();
   const token = localStorage.getItem("token");
   const uname = localStorage.getItem("username");

   currentUser = await User.updateUser(pword, name, token, uname);
   console.log(currentUser);
   syncCurrentUserToLocalStorage();
   $editAccountForm.hide();
   $editAccountForm.trigger("reset");
   alert("user updated");
  })



  /* 
  * Event Listener to handle toggling
  * favorites in the ui and on users
  *  list and a helper function to 
  * discern which class it has
  */

  function checkForFave(arr){
    return (arr.contains("fas") ? "fas" : "far");
  }

  $articlesContainer.on("click",async function(e){
    const name = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    if(e.target.classList.contains("fa-heart")){
      const classes = e.target.classList;
      let faveclass = checkForFave(classes);
      const favestoryid = e.target.parentNode.id;

     currentUser = await User.toggleFave(faveclass,name,favestoryid, token);
 
     e.target.classList.toggle("far");
     e.target.classList.toggle("fas");
     generateFavorites();
    }
    if(e.target.classList.contains("fa-trash-alt")){

      const myStoryId = e.target.parentNode.id;
      await storyList.deleteStory(currentUser, myStoryId);

      currentUser = await User.getLoggedInUser(token, name);
      syncCurrentUserToLocalStorage();
      await generateStories();
      generateMyStories();
    }
    if(e.target.classList.contains("fa-edit")){
      $submitFormButton.hide()
      $editButton.show();
      $submitForm.show();
      editedStory = e.target.parentNode.id;
    }
    })

    $editButton.on("click", async function(){
      const newAuthor = $("#author").val();
      const newTitle = $("#title").val();
      const newURL = $("#url").val();
      const newStory = new Story({author: newAuthor, title: newTitle, url: newURL});
      await User.updateStory(currentUser, newStory, editedStory);
    
      const name = localStorage.getItem("username");
      const token = localStorage.getItem("token");
      currentUser = await User.getLoggedInUser(token, name);
      syncCurrentUserToLocalStorage();
      await generateStories();
      generateMyStories();
      $submitForm.hide();
      $submitForm.trigger("reset");
      $editButton.hide();
      $submitFormButton.show();
    })

    /* 
    * function to generate the favorite stories
    */
   function generateFavorites() {
    // empty out that part of the page
    $favoriteArticles.empty();
    // loop through all of our stories and generate HTML for them
    for (let story of currentUser.favorites) {
      const result = generateStoryHTML(story);
      const favLi = result.get(0).firstElementChild;
      favLi.classList.toggle("far");
      favLi.classList.toggle("fas");
      $favoriteArticles.append(result);
    }
  }
  // function to generate my stories
  function generateMyStories() {
    // empty out that part of the page
    $myArticles.empty();
    // loop through all of our stories and generate HTML for them
    for (let story of currentUser.ownStories) {
      const result = generateStoryHTML(story);
      let favLi = result.get(0).firstElementChild;
      currentUser.favorites.forEach(fave => {
       if(isEquivalent(story, fave)){
        favLi.classList.toggle("far");
        favLi.classList.toggle("fas");
       } 
      })
      result.prepend("<i class='fas fa-trash-alt'></i>");
      result.append("<i class='far fa-edit'></i>")
      console.log(result);
      $myArticles.append(result);
    }
  }



/*
* check if a story is also a favorite function
*  credit to http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
*/

function isEquivalent(a, b) {
  // Create arrays of property names
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);
  // If number of properties is different,
  // objects are not equivalent
  if (aProps.length != bProps.length) {
      return false;
  }
  for (var i = 0; i < aProps.length; i++) {
      var propName = aProps[i];
      // If values of same property are not equal,
      // objects are not equivalent
      if (a[propName] !== b[propName]) {
          return false;
      }
  }
  // If we made it this far, objects
  // are considered equivalent
  return true;
}
  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  async function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    await generateStories();
    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories(0);
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      if(currentUser){
        const favLi = result.get(0).firstElementChild;
        currentUser.favorites.forEach(fave => {
         if(isEquivalent(story, fave)){
          favLi.classList.toggle("far");
          favLi.classList.toggle("fas");
         } 
        })
      }

      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <i class="far fa-heart"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $favoriteArticles, //BB
      $myArticles, //BB
      $editAccountForm //BB

    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $mainNavLinks.show();
    $navUserProfile.append(`${localStorage.getItem("username")}`);//BB
    $navWelcome.show();
    $profileName.append(` ${currentUser.name}`);
    $profileUsername.append(` ${currentUser.username}`);
    $profileAccountDate.append(` ${currentUser.createdAt}`);

  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

  /*
* Infinite Scroll -BB
*/
async function generateMoreStories( count ) {
  // get an instance of StoryList
  const storyListInstance = await StoryList.getStories(25 * count);
  // update our global variable
  storyListInstance.stories.forEach(story => {
    storyList.stories.push(story);
  })
  // empty out that part of the page
  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const result = generateStoryHTML(story);
    if(currentUser){
      const favLi = result.get(0).firstElementChild;
      currentUser.favorites.forEach(fave => {
       if(isEquivalent(story, fave)){
        favLi.classList.toggle("far");
        favLi.classList.toggle("fas");
       } 
      })
    }

    $allStoriesList.append(result);
  }
}
window.onscroll = async function(ev) {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {

      if(storyList.stories.length % 25 === 0){
       await generateMoreStories(storyCount);
       storyCount++;
      }
  }
};

});

