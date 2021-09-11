import React, { Component } from "react";
import {
  Text,
  View,
  ScrollView,
  FlatList,
  Modal,
  Button,
  StyleSheet,
  TextInput,
  Alert,
  PanResponder,
} from "react-native";

import { Card, Icon, Input, Rating } from "react-native-elements";
import { connect } from "react-redux";
import { baseUrl } from "../shared/baseUrl";
import { postComment, postFavorite } from "../redux/ActionCreators";
import * as Animatable from "react-native-animatable";

const mapStateToProps = (state) => {
  return {
    campsites: state.campsites,
    comments: state.comments,
    favorites: state.favorites,
  };
};

const mapDispatchToProps = {
  postFavorite: (campsiteId) => postFavorite(campsiteId),
  postComment: (campsiteId, rating, author, text) =>
    postComment(campsiteId, rating, author, text),
};

function RenderCampsite(props) {
  const { campsite } = props;

  const view = React.createRef();

  const recognizeDrag = ({ dx }) => (dx < -200 ? true : false);
  const recognizeComment = ({ dx }) => (dx > 200 ? true : false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      view.current
        .rubberBand(1000)
        .then((endState) =>
          console.log(endState.finished ? "finished" : "canceled")
        );
    },
    onPanResponderEnd: (e, gestureState) => {
      console.log("pan responder end", gestureState);
      if (recognizeDrag(gestureState)) {
        Alert.alert(
          "Add Favorite",
          "Are you sure you wish to add " + campsite.name + " to favorites?",

          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => console.log("Cancel Pressed"),
            },
            {
              text: "Yes",
              onPress: () =>
                props.favorite
                  ? console.log("Already set as favorite")
                  : props.markFavorite(),
            },
          ],
          { cancelable: false }
        );
      } else if (recognizeComment(gestureState)) {
        props.onShowModal();
      }
      return true;
    },
  });

  if (campsite) {
    return (
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        {...panResponder.panHandlers}
        ref={view}
      >
        <Card
          featuredTitle={campsite.name}
          image={{ uri: baseUrl + campsite.image }}
        >
          <Text style={{ margin: 10 }}>{campsite.description}</Text>
          <View style={styles.cardRow}>
            <Icon
              name={props.favorite ? "heart" : "heart-o"}
              type="font-awesome"
              color="#f50"
              raised
              reverse
              onPress={() =>
                props.favorite
                  ? console.log("Campsite already favorited")
                  : props.markFavorite()
              }
            />
            <Icon
              name="pencil"
              type="font-awesome"
              color="#5637DD"
              raised
              reverse
              onPress={() => props.onShowModal()}
            />
          </View>
        </Card>
      </Animatable.View>
    );
  }
  return <View />;
}

function RenderComments({ comments }) {
  const renderCommentItem = ({ item }) => {
    return (
      <View style={{ margin: 10 }}>
        <Text style={{ fontSize: 14 }}>{item.text}</Text>
        <Rating
          startingValue={item.rating}
          imageSize={10}
          style={{ paddingVertical: "5%", alignItems: "flex-start" }}
          readonly
        />
        <Text
          style={{ fontSize: 12 }}
        >{`-- ${item.author}, ${item.date}`}</Text>
      </View>
    );
  };

  return (
    <Animatable.View animation="fadeInUp" duration={1000}>
      <Card title="Comments">
        <FlatList
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={(item) => item.id.toString()}
        />
      </Card>
    </Animatable.View>
  );
}

class CampsiteInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      rating: 5,
      author: "",
      text: "",
    };
  }

  resetForm() {
    this.setState({
      rating: 5,
      author: "",
      text: "",
    });
  }

  toggleModal() {
    this.setState({ showModal: !this.state.showModal });
  }

  handleComment(campsiteId) {
    console.log(JSON.stringify(this.state));
    this.props.postComment(
      campsiteId,
      this.state.rating,
      this.state.author,
      this.state.text
    );
    this.toggleModal();
  }

  markFavorite(campsiteId) {
    this.props.postFavorite(campsiteId);
  }

  static navigationOptions = {
    title: "Campsite Information",
  };

  render() {
    const campsiteId = this.props.navigation.getParam("campsiteId");
    const campsite = this.props.campsites.campsites.filter(
      (campsite) => campsite.id === campsiteId
    )[0];
    const comments = this.props.comments.comments.filter(
      (comment) => comment.campsiteId === campsiteId
    );
    return (
      <ScrollView>
        <RenderCampsite
          campsite={campsite}
          favorite={this.props.favorites.includes(campsiteId)}
          markFavorite={() => this.markFavorite(campsiteId)}
          onShowModal={() => this.toggleModal()}
        />
        <RenderComments comments={comments} />
        <Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.showModal}
          onRequestClose={() => this.toggleModal()}
        >
          <View style={styles.modal}>
            <Rating
              style={{ paddingVertical: 10 }}
              showRating
              startingValue={5}
              imageSize={40}
              onFinishRating={(rating) => this.setState({ rating: rating })}
            />
            <Input
              palceholder="Author"
              leftIcon={{
                type: "font-awesome",
                name: "user-o",
              }}
              onChangeText={(author) => this.setState({ author: author })}
              leftIconContainerStyle={{ paddingRight: 10 }}
              value={this.state.author}
            />
            <Input
              palceholder="Comment"
              leftIcon={{
                type: "font-awesome",
                name: "comment-o",
              }}
              onChangeText={(text) => this.setState({ text: text })}
              leftIconContainerStyle={{ paddingRight: 10 }}
              value={this.state.text}
            />
            <View>
              <Button
                title="Submit"
                color="#5637DD"
                onPress={() => {
                  this.handleComment();
                  this.resetForm();
                }}
              />
            </View>
            <View style={{ margin: 10 }}>
              <Button
                onPress={() => this.toggleModal()}
                color="#808080"
                title="Cancel"
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  cardRow: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    flexDirection: "row",
    margin: 20,
  },
  modal: {
    justifyContent: "center",
    margin: 20,
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CampsiteInfo);
